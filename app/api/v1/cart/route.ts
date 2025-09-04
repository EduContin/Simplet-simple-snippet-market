import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import database from "@/infra/database";

// Helper to extract price from thread's first post metadata ([b]Price:[/b] ...)
async function getThreadPriceCents(threadId: number): Promise<number> {
  const res = await database.query({
    text: `SELECT content FROM posts WHERE thread_id = $1 ORDER BY created_at ASC LIMIT 1`,
    values: [threadId],
  });
  if (res.rowCount === 0) return 0;
  const content = res.rows[0].content as string;
  const match = content.match(/\[b\]Price:\[\/b\]\s*([^\n]+)/i);
  if (!match) return 0;
  const val = match[1].trim();
  if (/up for discussion/i.test(val)) return 0;
  const money = val.replace(/\$/g, '').trim();
  const num = Number(money);
  if (!isFinite(num) || num < 0) return 0;
  return Math.round(num * 100);
}

export async function GET(request: NextRequest) {
  const session: any = await getServerSession(authOptions as any);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ items: [], total_cents: 0 });

  try {
    const itemsRes = await database.query({
      text: `SELECT ci.thread_id, ci.price_cents, t.title
             FROM cart_items ci
             JOIN threads t ON t.id = ci.thread_id
             WHERE ci.user_id = $1
             ORDER BY ci.created_at DESC`,
      values: [userId],
    });
    const items = itemsRes.rows.map((r: any) => ({
      thread_id: Number(r.thread_id),
      title: r.title as string,
      price_cents: Number(r.price_cents || 0),
    }));
    const total_cents = items.reduce((sum: number, it: any) => sum + it.price_cents, 0);
    return NextResponse.json({ items, total_cents });
  } catch (e) {
    console.error('Cart GET error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session: any = await getServerSession(authOptions as any);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const threadId = Number(body?.threadId);
  if (!Number.isFinite(threadId)) {
    return NextResponse.json({ error: 'threadId required' }, { status: 400 });
  }

  try {
    // Compute price at add-time, honoring MIT/free and discussion
    const priceCents = await getThreadPriceCents(threadId);
    await database.query({
      text: `INSERT INTO cart_items (user_id, thread_id, price_cents)
             VALUES ($1, $2, $3)
             ON CONFLICT (user_id, thread_id) DO UPDATE SET price_cents = EXCLUDED.price_cents`,
      values: [userId, threadId, priceCents],
    });
    return NextResponse.json({ ok: true, thread_id: threadId, price_cents: priceCents });
  } catch (e) {
    console.error('Cart POST error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session: any = await getServerSession(authOptions as any);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const threadId = Number(searchParams.get('threadId'));
  if (!Number.isFinite(threadId)) {
    return NextResponse.json({ error: 'threadId required' }, { status: 400 });
  }
  try {
    await database.query({
      text: `DELETE FROM cart_items WHERE user_id = $1 AND thread_id = $2`,
      values: [userId, threadId],
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Cart DELETE error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
