import { NextRequest, NextResponse } from "next/server";
import database from "@/infra/database";
import { slugify } from "@/models/slugify";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "10");
  const categoryId = searchParams.get("categoryId");
  const threadId = searchParams.get("threadId");
  const userId = searchParams.get("userId");
  const announcementsParam = searchParams.get("announcements"); 
  const likedBy = searchParams.get("likedBy");
  const ownedBy = searchParams.get("ownedBy");

  const offset = (page - 1) * pageSize;

  try {
    // Helpers to derive meta from first post BBCode content
    const parseLine = (label: string, content: string): string | null => {
      const re = new RegExp(String.raw`\[b\]${label}:\[/b\]\s*([^\n]+)`, 'i');
      const m = content.match(re);
      return m ? m[1].trim() : null;
    };
    const parseTags = (content: string): string[] => {
      const raw = parseLine('Tags', content) || '';
      return raw
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
        .slice(0, 6);
    };
    const parseLicense = (content: string): string | null => parseLine('License', content);
    const parsePrice = (content: string): { cents: number; label: string } => {
      const raw = parseLine('Price', content) || '';
      if (!raw || /discussion/i.test(raw)) return { cents: 0, label: 'Up for discussion' };
      const m = raw.match(/\$\s*([0-9]+(?:\.[0-9]{1,2})?)/);
      if (!m) return { cents: 0, label: raw };
      const num = parseFloat(m[1]);
      const cents = Math.max(0, Math.round(num * 100));
      return { cents, label: `$${(cents/100).toFixed(2)}` };
    };

    let query = `
    SELECT  
        t.*,
        u.username,
        c.name AS category_name,
        COUNT(p.id) AS post_count,
        MAX(p.created_at) AS last_post_at,
        (SELECT id FROM posts WHERE thread_id = t.id ORDER BY created_at ASC LIMIT 1) AS first_post_id,
  COALESCE((SELECT likes_count FROM posts WHERE thread_id = t.id ORDER BY created_at ASC LIMIT 1), 0) AS first_post_likes,
  (SELECT content FROM posts WHERE thread_id = t.id ORDER BY created_at ASC LIMIT 1) AS first_post_content,
  COALESCE(t.revenue_cents, 0) AS revenue_cents,
  COALESCE((SELECT COUNT(1) FROM snippet_files sf WHERE sf.thread_id = t.id), 0) AS file_count
      , COALESCE((
        SELECT json_agg(sf2)
        FROM (
          SELECT id, filename, language, is_entry, LEFT(content, 800) AS content
          FROM snippet_files sf WHERE sf.thread_id = t.id
          ORDER BY is_entry DESC, filename ASC
          LIMIT 5
        ) sf2
      ), '[]'::json) AS files_preview
      FROM threads t
      JOIN users u ON t.user_id = u.id
      JOIN categories c ON t.category_id = c.id
      LEFT JOIN posts p ON t.id = p.thread_id
    `;

    const queryParams: any[] = [];
    const whereConditions: string[] = [];

  if (categoryId) {
      whereConditions.push(`t.category_id = $${queryParams.length + 1}`);
      queryParams.push(categoryId);
    }

    if (threadId) {
      whereConditions.push(`t.id = $${queryParams.length + 1}`);
      queryParams.push(threadId);
    }

    if (userId) {
      whereConditions.push(`t.user_id = $${queryParams.length + 1}`);
      queryParams.push(userId);
    }

    if (likedBy && likedBy.toLowerCase() === "me") {
      // Resolve current user from session
      const session: any = await getServerSession(authOptions as any);
      const meId = session?.user?.id;
      if (!meId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      whereConditions.push(`EXISTS (
        SELECT 1 FROM likes l
        WHERE l.user_id = $${queryParams.length + 1}
          AND l.post_id = (SELECT id FROM posts WHERE thread_id = t.id ORDER BY created_at ASC LIMIT 1)
      )`);
      queryParams.push(meId);
    }

    if (ownedBy && ownedBy.toLowerCase() === 'me') {
      const session: any = await getServerSession(authOptions as any);
      const meId = session?.user?.id;
      if (!meId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      whereConditions.push(`EXISTS (
        SELECT 1 FROM snippet_purchases sp
        WHERE sp.buyer_user_id = $${queryParams.length + 1}
          AND sp.thread_id = t.id
      )`);
      queryParams.push(meId);
    }

    if (announcementsParam && announcementsParam.toLowerCase() === "true") {
      whereConditions.push(`t.announcements = true`);
    }

    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(" AND ")}`;
    }

    query += `
  GROUP BY t.id, u.username, c.name
      ORDER BY t.created_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    queryParams.push(pageSize, offset);

    const result = await database.query({
      text: query,
      values: queryParams,
    });
    // Derive meta client needs for cards
    const rows = result.rows.map((r: any) => {
      const content = String(r.first_post_content || '');
      const tags = parseTags(content);
      const license = parseLicense(content);
      const price = parsePrice(content);
      return {
        ...r,
        meta_tags: tags,
        meta_license: license,
        meta_price_label: price.label,
        meta_price_cents: price.cents,
      };
    });

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching threads:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const { title, content, userId, categoryId, announcements } = await request.json();
  const ann = announcements === true ? true : false;

  try {
    const result = await database.query({
      text: `
        WITH new_thread AS (
          INSERT INTO threads (title, user_id, category_id, announcements)
          VALUES ($1, $2, $3, $4)
          RETURNING id
        )
        INSERT INTO posts (content, user_id, thread_id)
        SELECT $5, $2, id FROM new_thread
        RETURNING thread_id
      `,
  values: [title, userId, categoryId, ann, content],
    });

    const threadId = result.rows[0].thread_id;
    const slug = slugify(title);

    // Increment the threads_count on the users table
    await database.query({
      text: `
        UPDATE users
        SET threads_count = threads_count + 1,
        posts_count = posts_count + 1
        WHERE id = $1
      `,
      values: [userId],
    });

    return NextResponse.json({ threadId, slug }, { status: 201 });
  } catch (error) {
    console.error("Error creating thread:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  // Admin-only verify/unverify thread
  const session: any = await getServerSession(authOptions as any);
  const meId = session?.user?.id;
  if (!meId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Ensure caller is Admin
  const me = await database.query({ text: "SELECT user_group FROM users WHERE id = $1", values: [meId] });
  const isAdmin = me.rows?.[0]?.user_group === "Admin";
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { threadId, verify } = await request.json();
  if (!Number.isFinite(Number(threadId))) return NextResponse.json({ error: "Invalid threadId" }, { status: 400 });

  try {
    const q = verify === true
      ? {
          text: `UPDATE threads SET is_verified = true, verified_by_user_id = $1, verified_at = NOW(), updated_at = NOW() WHERE id = $2 RETURNING id, is_verified, verified_at` ,
          values: [meId, Number(threadId)],
        }
      : {
          text: `UPDATE threads SET is_verified = false, verified_by_user_id = NULL, verified_at = NULL, updated_at = NOW() WHERE id = $1 RETURNING id, is_verified, verified_at`,
          values: [Number(threadId)],
        };
    const res = await database.query(q);
    if (res.rowCount === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(res.rows[0]);
  } catch (e) {
    console.error("PATCH /api/v1/threads verify failed", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
