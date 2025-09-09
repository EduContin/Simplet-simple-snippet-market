import { NextRequest, NextResponse } from "next/server";
import database from "@/infra/database";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const threadId = Number(params.id);
  if (!Number.isFinite(threadId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const { searchParams } = new URL(request.url);
  const days = Math.max(1, Math.min(365, Number(searchParams.get('days') || 90)));

  try {
    // Find first post id for thread
    const first = await database.query({
      text: `SELECT id FROM posts WHERE thread_id = $1 ORDER BY created_at ASC LIMIT 1`,
      values: [threadId],
    });
    if (first.rowCount === 0) return NextResponse.json({ series: [] });
    const postId = Number(first.rows[0].id);

    // Aggregate likes by day
    const res = await database.query({
      text: `SELECT date_trunc('day', created_at) AS day, COUNT(*)::int AS cnt
             FROM likes
             WHERE post_id = $1 AND created_at >= NOW() - ($2::int || ' days')::interval
             GROUP BY 1
             ORDER BY 1 ASC`,
      values: [postId, days],
    });

    // Build continuous series for last N days
    const byDay: Record<string, number> = {};
    for (const row of res.rows) {
      const d = new Date(row.day);
      const key = d.toISOString().slice(0, 10);
      byDay[key] = Number(row.cnt) || 0;
    }
    const today = new Date();
    today.setHours(0,0,0,0);
    const start = new Date(today);
    start.setDate(start.getDate() - (days - 1));
    const series: { date: string; count: number; cumulative: number }[] = [];
    let cum = 0;
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      const c = byDay[key] || 0;
      cum += c;
      series.push({ date: key, count: c, cumulative: cum });
    }

    return NextResponse.json({ series });
  } catch (e) {
    console.error('GET /threads/:id/likes/timeseries error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
