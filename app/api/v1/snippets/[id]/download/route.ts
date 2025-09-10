import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import database from '@/infra/database';

// Returns raw code of the first post if user owns the snippet (or is author)
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session: any = await getServerSession(authOptions as any);
  const meId = session?.user?.id;
  if (!meId) return new NextResponse('Unauthorized', { status: 401 });
  const threadId = Number(params.id);
  if (!Number.isFinite(threadId)) return new NextResponse('Invalid id', { status: 400 });
  try {
    // Check ownership or authorship
    const own = await database.query({
      text: `SELECT 1 FROM snippet_purchases WHERE buyer_user_id=$1 AND thread_id=$2`,
      values: [meId, threadId],
    });
    const thr = await database.query({ text: `SELECT user_id FROM threads WHERE id=$1`, values: [threadId] });
    if (thr.rowCount === 0) return new NextResponse('Not found', { status: 404 });
    const authorId = Number(thr.rows[0].user_id);
    if (own.rowCount === 0 && authorId !== Number(meId)) return new NextResponse('Forbidden', { status: 403 });
    // Get first post
    const post = await database.query({ text: `SELECT content FROM posts WHERE thread_id=$1 ORDER BY created_at ASC LIMIT 1`, values: [threadId] });
    if (post.rowCount === 0) return new NextResponse('No content', { status: 404 });
    const content: string = post.rows[0].content;
    // Extract code between [code]...[/code]
    const match = content.match(/\[code\]([\s\S]*?)\[\/code\]/i);
    const code = (match ? match[1] : content).trim();
    return new NextResponse(code, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="snippet-${threadId}.txt"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    console.error('Download snippet error', e);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
