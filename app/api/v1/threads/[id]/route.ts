import { NextRequest, NextResponse } from "next/server";
import database from "@/infra/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";

async function assertOwner(userId: number, threadId: number) {
  const res = await database.query({
    text: "SELECT user_id FROM threads WHERE id = $1",
    values: [threadId],
  });
  if (res.rowCount === 0) return { ok: false, status: 404 } as const;
  if (Number(res.rows[0].user_id) !== Number(userId)) return { ok: false, status: 403 } as const;
  return { ok: true } as const;
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session: any = await getServerSession(authOptions as any);
  const meId = session?.user?.id;
  if (!meId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const threadId = Number(params.id);
  if (!Number.isFinite(threadId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const { title, code } = await request.json();
  const own = await assertOwner(meId, threadId);
  if (!own.ok) return NextResponse.json({ error: own.status === 403 ? "Forbidden" : "Not found" }, { status: own.status });

  try {
    await database.withTransaction(async (client) => {
      if (title && typeof title === "string") {
        await database.queryWithClient(client, { text: "UPDATE threads SET title = $1, updated_at = NOW() WHERE id = $2", values: [title, threadId] });
      }
      if (typeof code === "string") {
        const first = await database.queryWithClient(client, {
          text: "SELECT id FROM posts WHERE thread_id = $1 ORDER BY created_at ASC LIMIT 1",
          values: [threadId],
        });
        if (first.rowCount > 0) {
          const wrapped = `[code]${code}\n[/code]`;
          await database.queryWithClient(client, { text: "UPDATE posts SET content = $1, updated_at = NOW() WHERE id = $2", values: [wrapped, first.rows[0].id] });
        }
      }
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("PATCH /threads/:id failed", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session: any = await getServerSession(authOptions as any);
  const meId = session?.user?.id;
  if (!meId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const threadId = Number(params.id);
  if (!Number.isFinite(threadId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const own = await assertOwner(meId, threadId);
  if (!own.ok) return NextResponse.json({ error: own.status === 403 ? "Forbidden" : "Not found" }, { status: own.status });

  try {
    await database.withTransaction(async (client) => {
      // get owner id and posts count for counters adjustment
      const threadInfo = await database.queryWithClient(client, {
        text: `SELECT user_id FROM threads WHERE id = $1`,
        values: [threadId],
      });
      const ownerId = threadInfo.rows?.[0]?.user_id;

      // Count posts to decrement posts_count properly
      const postsCountRes = await database.queryWithClient(client, {
        text: `SELECT COUNT(1) AS c FROM posts WHERE thread_id = $1`,
        values: [threadId],
      });
      const postsCount = Number(postsCountRes.rows?.[0]?.c ?? 0);

      // Delete thread (cascades posts and likes)
      await database.queryWithClient(client, { text: "DELETE FROM threads WHERE id = $1", values: [threadId] });

      if (ownerId) {
        await database.queryWithClient(client, {
          text: `UPDATE users SET threads_count = GREATEST(0, threads_count - 1), posts_count = GREATEST(0, posts_count - $1) WHERE id = $2`,
          values: [postsCount, ownerId],
        });
      }
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /threads/:id failed", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
