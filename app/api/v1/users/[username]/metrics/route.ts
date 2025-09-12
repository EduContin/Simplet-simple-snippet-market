import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import database from "@/infra/database";

export async function GET(req: NextRequest, { params }: { params: { username: string } }) {
  try {
    const { username } = params;
  const session: any = await getServerSession(authOptions as any);
    // Get user id and public counters
    const ures = await database.query({
      text: `SELECT id, likes_received, threads_count FROM users WHERE LOWER(username)=LOWER($1)`,
      values: [username],
    });
    if (ures.rowCount === 0) return NextResponse.json({ error: "User not found" }, { status: 404 });
    const userId = Number(ures.rows[0].id);
    const likes_received = Number(ures.rows[0].likes_received || 0);
    const threads_count = Number(ures.rows[0].threads_count || 0);

    // Sum likes on first posts of this user's threads (snippet success proxy)
    const likesOnSnippetsRes = await database.query({
      text: `SELECT COALESCE(SUM(p.likes_count),0) as total
             FROM threads t
             JOIN LATERAL (
               SELECT id, likes_count FROM posts WHERE thread_id=t.id ORDER BY created_at ASC LIMIT 1
             ) p ON true
             WHERE t.user_id = $1`,
      values: [userId],
    });
    const likes_on_snippets = Number(likesOnSnippetsRes.rows[0].total || 0);

    // Earnings: prefer denormalized users.earnings_cents if present; fallback to wallet tx sum
    let earnings_cents = 0;
    try {
      const earn = await database.query({ text: `SELECT earnings_cents FROM users WHERE id=$1`, values: [userId] });
      if (earn.rowCount) earnings_cents = Number(earn.rows[0].earnings_cents || 0);
    } catch {}
    if (!earnings_cents) {
      const earningsRes = await database.query({
        text: `SELECT COALESCE(SUM(amount_cents),0) as cents
               FROM wallet_transactions
               WHERE status='confirmed' AND to_user_id = $1`,
        values: [userId],
      });
      earnings_cents = Number(earningsRes.rows[0].cents || 0);
    }

    // Verified stamps acquired: count of user's threads that are verified
    const verifiedRes = await database.query({
      text: `SELECT COUNT(1) AS c FROM threads WHERE user_id = $1 AND is_verified = true`,
      values: [userId],
    });
    const verified_stamps = Number(verifiedRes.rows[0].c || 0);
    // Privacy: only owner can see earnings
    if (!session?.user?.id || Number(session.user.id) !== userId) {
      earnings_cents = 0;
    }

    return NextResponse.json({
      likes_received,
      threads_count,
      likes_on_snippets,
  earnings_cents,
  verified_stamps,
    });
  } catch (e) {
    console.error('metrics error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
