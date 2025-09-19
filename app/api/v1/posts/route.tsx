import { NextRequest, NextResponse } from "next/server";
import database from "@/infra/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const threadId = searchParams.get("threadId");

  try {
    const result = await database.query({
      text: `
        SELECT p.*, u.username, u.avatar_url
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.thread_id = $1
        ORDER BY p.created_at ASC
      `,
      values: [threadId],
    });

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const { content, threadId, userId } = await request.json();

  try {
    const result = await database.query({
      text: `
        INSERT INTO posts (content, thread_id, user_id)
        VALUES ($1, $2, $3)
        RETURNING id, user_id
      `,
      values: [content, threadId, userId],
    });

    if(result.rows.length > 0){
      await database.query({
        text : `UPDATE users SET posts_count = posts_count + 1 WHERE id=$1`,
        values : [result.rows[0].user_id]
      });
    }

    return NextResponse.json({ postId: result.rows[0].id }, { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const postIdStr = searchParams.get("postId");
  const postId = Number(postIdStr);

  if (!Number.isFinite(postId)) {
    return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
  }

  try {
    const session: any = await getServerSession(authOptions as any);
    const meId = session?.user?.id;
    if (!meId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify ownership and get counts
    const pre = await database.query({
      text: `SELECT user_id FROM posts WHERE id = $1`,
      values: [postId],
    });
    if (pre.rowCount === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    if (Number(pre.rows[0].user_id) !== Number(meId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await database.withTransaction(async (client) => {
      // Count likes to decrement likes_received accordingly
      const likesRes = await database.queryWithClient(client, {
        text: `SELECT COUNT(1) AS c FROM likes WHERE post_id = $1`,
        values: [postId],
      });
      const likesCount = Number(likesRes.rows?.[0]?.c ?? 0);

      // Remove likes
      await database.queryWithClient(client, {
        text: `DELETE FROM likes WHERE post_id = $1`,
        values: [postId],
      });

      // Delete post
      const del = await database.queryWithClient(client, {
        text: `DELETE FROM posts WHERE id = $1 RETURNING user_id`,
        values: [postId],
      });
      if (del.rowCount === 0) throw new Error("delete failed");

      // Update counters: posts_count --, likes_received -= likesCount
      await database.queryWithClient(client, {
        text: `UPDATE users SET posts_count = GREATEST(0, posts_count - 1), likes_received = GREATEST(0, likes_received - $1) WHERE id = $2`,
        values: [likesCount, meId],
      });
    });

    return NextResponse.json({ id: postId });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
