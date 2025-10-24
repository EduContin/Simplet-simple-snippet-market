import { NextRequest, NextResponse } from "next/server";
import database from "@/infra/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";

export async function POST(request: NextRequest) {
  const session: any = await getServerSession(authOptions as any);
  const meId = session?.user?.id;
  if (!meId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, categoryId, files, meta } = await request.json();
  if (!Array.isArray(files) || files.length === 0) {
    return NextResponse.json({ error: 'files required' }, { status: 400 });
  }
  // Ensure at least one entry file
  const hasEntry = files.some((f: any) => !!f.is_entry);
  if (!hasEntry) files[0].is_entry = true;
  try {
    let threadId: number = 0;
  await database.withTransaction(async (client) => {
      // Create thread and first post as brief descriptor linking to files
      const insThread = await database.queryWithClient(client, {
        text: `INSERT INTO threads (title, user_id, category_id) VALUES ($1, $2, $3) RETURNING id`,
    values: [title || 'Snippet', meId, categoryId],
      });
      threadId = insThread.rows[0].id;
      // Create a first post with optional meta so homepage derives tags/license/price
      const firstPost = typeof meta === 'string' && meta.trim().length > 0
        ? `${meta}\n\n[code]Multi-file snippet created[/code]`
        : "[code]Multi-file snippet created[/code]";
      await database.queryWithClient(client, {
        text: `INSERT INTO posts (content, user_id, thread_id) VALUES ($1, $2, $3)`,
        values: [firstPost, meId, threadId],
      });
      // Insert snippet files
      for (const f of files) {
        await database.queryWithClient(client, {
          text: `INSERT INTO snippet_files (thread_id, filename, language, is_entry, content) VALUES ($1, $2, $3, $4, $5)`,
          values: [threadId, f.filename, f.language || null, !!f.is_entry, f.content || ""],
        });
      }
      // Update user counters
      await database.queryWithClient(client, {
        text: `UPDATE users SET threads_count = threads_count + 1, posts_count = posts_count + 1 WHERE id = $1`,
    values: [meId],
      });
    });
    return NextResponse.json({ threadId }, { status: 201 });
  } catch (e) {
    console.error('POST /threads/multi failed', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
