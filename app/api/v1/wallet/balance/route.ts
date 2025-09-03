import { NextRequest, NextResponse } from "next/server";
import database from "@/infra/database";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
  const result = await database.query({
    text: `SELECT balance_cents, currency FROM wallets WHERE user_id = $1`,
    values: [userId],
  });
  if (result.rows.length === 0) {
    // Auto-create wallet with zero balance
    await database.query({
      text: `INSERT INTO wallets (user_id, balance_cents, currency) VALUES ($1, 0, 'BRL') ON CONFLICT (user_id) DO NOTHING`,
      values: [userId],
    });
    return NextResponse.json({ balance_cents: 0, currency: 'BRL' });
  }
  return NextResponse.json(result.rows[0]);
}
