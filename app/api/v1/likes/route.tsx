import database from "@/infra/database";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const postIds = searchParams.get("postIds")?.split(",").map((n) => Number(n)).filter((n) => Number.isFinite(n));
  const threadId = searchParams.get("threadId");

  // Optional auth (only needed if we want to know whether current user liked it)
  const session: any = await getServerSession(authOptions as any).catch(() => null);
  const userId = session?.user?.id as number | undefined;

  try {
    // Mode 1: threadId -> respond with first post like count + whether liked (if user present)
    if (threadId) {
      const firstPost = await database.query({
        text: `SELECT id, likes_count FROM posts WHERE thread_id = $1 ORDER BY created_at ASC LIMIT 1`,
        values: [threadId],
      });
      if (firstPost.rowCount === 0) {
        return NextResponse.json({ count: 0, liked: false });
      }
      const pid = firstPost.rows[0].id;
      const likesCount = Number(firstPost.rows[0].likes_count ?? 0);
      let liked = false;
      if (userId) {
        const likedRes = await database.query({
          text: `SELECT EXISTS(SELECT 1 FROM likes WHERE user_id = $1 AND post_id = $2) AS liked`,
          values: [userId, pid],
        });
        liked = !!likedRes.rows[0]?.liked;
      }
      return NextResponse.json({ count: likesCount, liked });
    }

    // Mode 2: postIds -> return map with counts and liked state (if user present)
    if (!postIds || postIds.length === 0) {
      return NextResponse.json({});
    }

    // Fetch counts
    const countsRes = await database.query({
      text: `SELECT id as post_id, likes_count FROM posts WHERE id = ANY($1::int[])`,
      values: [postIds],
    });
    const countsMap: Record<number, number> = {};
    for (const row of countsRes.rows) countsMap[Number(row.post_id)] = Number(row.likes_count ?? 0);

    // Fetch liked flags if we have a user
    let likedMap: Record<number, boolean> = {};
    if (userId) {
      const likedRes = await database.query({
        text: `SELECT post_id FROM likes WHERE user_id = $1 AND post_id = ANY($2::int[])`,
        values: [userId, postIds],
      });
      for (const row of likedRes.rows) likedMap[Number(row.post_id)] = true;
    }

    // Build response map
    const response: Record<number, { count: number; liked: boolean }> = {};
    for (const pid of postIds) {
      response[pid] = { count: countsMap[pid] ?? 0, liked: !!likedMap[pid] };
    }
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching likes:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const postIdFromBody: number | undefined = body?.postId;
  const threadId: number | undefined = body?.threadId;

  // Resolve user from session if not explicitly provided
  const session: any = await getServerSession(authOptions as any);
  const userId = session?.user?.id ?? body?.userId; // backward compat with older clients

  if (!userId) {
    return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
  }

  // Resolve target postId (allow threadId -> first post)
  let postId = postIdFromBody;
  if (!postId && threadId) {
    const first = await database.query({
      text: `SELECT id FROM posts WHERE thread_id = $1 ORDER BY created_at ASC LIMIT 1`,
      values: [threadId],
    });
    if (first.rowCount === 0) {
      return NextResponse.json({ error: "Thread has no posts" }, { status: 404 });
    }
    postId = first.rows[0].id;
  }

  if (!postId) {
    return NextResponse.json({ error: "postId or threadId is required" }, { status: 400 });
  }

  try {
    // Start a transaction
    await database.query("BEGIN");

    // Try to insert a like
    const insertResult = await database.query({
      text: "INSERT INTO likes (user_id, post_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *",
      values: [userId, postId],
    });

    if (insertResult.rowCount > 0) {
      // If a like was inserted, increment the likes_count and likes_received
      await database.query({
        text: "UPDATE posts SET likes_count = likes_count + 1 WHERE id = $1",
        values: [postId],
      });
      await database.query({
        text: "UPDATE users SET likes_received = likes_received + 1 WHERE id = (SELECT user_id FROM posts WHERE id = $1)",
        values: [postId],
      });
    } else {
      // If no like was inserted (already liked), remove the like
      await database.query({
        text: "DELETE FROM likes WHERE user_id = $1 AND post_id = $2",
        values: [userId, postId],
      });
      await database.query({
        text: "UPDATE posts SET likes_count = likes_count - 1 WHERE id = $1",
        values: [postId],
      });
      await database.query({
        text: "UPDATE users SET likes_received = likes_received - 1 WHERE id = (SELECT user_id FROM posts WHERE id = $1)",
        values: [postId],
      });
    }

    // Commit the transaction
    await database.query("COMMIT");

    // Fetch the updated post data
    const updatedPost = await database.query({
      text: "SELECT likes_count, (SELECT EXISTS(SELECT 1 FROM likes WHERE user_id = $1 AND post_id = $2)) as is_liked_by_user FROM posts WHERE id = $2",
      values: [userId, postId],
    });

    return NextResponse.json(updatedPost.rows[0]);
  } catch (error) {
    await database.query("ROLLBACK");
    console.error("Error handling like:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
