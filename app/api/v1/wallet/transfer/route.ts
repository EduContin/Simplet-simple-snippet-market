import { NextRequest, NextResponse } from "next/server";
import database from "@/infra/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";

export async function POST(request: NextRequest) {
  try {
  const session: any = await getServerSession(authOptions as any);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { from_user_id, to_user_id, amount_cents, currency } = await request.json();
    if (!from_user_id || !to_user_id || amount_cents === undefined) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    if (String(from_user_id) !== String(session.user.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (from_user_id === to_user_id) return NextResponse.json({ error: 'Cannot transfer to self' }, { status: 400 });
    const amt = Number(amount_cents);
    if (!Number.isInteger(amt) || amt <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    const curr = currency || 'BRL';

    const client = await database.getNewClient();
    try {
      await client.query('BEGIN');
      // Ensure wallets exist
      await client.query({ text: `INSERT INTO wallets (user_id, balance_cents, currency) VALUES ($1, 0, $2) ON CONFLICT (user_id) DO NOTHING`, values: [from_user_id, curr] });
      await client.query({ text: `INSERT INTO wallets (user_id, balance_cents, currency) VALUES ($1, 0, $2) ON CONFLICT (user_id) DO NOTHING`, values: [to_user_id, curr] });

      // Lock rows in a deterministic order to avoid deadlocks
      const ids = [from_user_id, to_user_id].sort();
      await client.query({ text: `SELECT user_id FROM wallets WHERE user_id = ANY($1) FOR UPDATE`, values: [ids] });

      // Check balance and currency
      const balRes = await client.query({ text: `SELECT balance_cents, currency FROM wallets WHERE user_id=$1`, values: [from_user_id] });
      const fromCurrency = balRes.rows[0]?.currency || curr;
      if (fromCurrency !== curr) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Currency mismatch' }, { status: 400 });
      }
      const bal = BigInt(balRes.rows[0]?.balance_cents ?? 0);
      if (bal < BigInt(amt)) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 });
      }
      // Record transaction
      const txRes = await client.query({
        text: `INSERT INTO wallet_transactions (type, amount_cents, currency, status, from_user_id, to_user_id)
               VALUES ('transfer', $1, $2, 'confirmed', $3, $4) RETURNING id`,
        values: [amt, curr, from_user_id, to_user_id],
      });
      const txId = txRes.rows[0].id;
      // Move funds
      await client.query({ text: `UPDATE wallets SET balance_cents = balance_cents - $2, updated_at=NOW() WHERE user_id=$1`, values: [from_user_id, amt] });
      await client.query({ text: `UPDATE wallets SET balance_cents = balance_cents + $2, updated_at=NOW() WHERE user_id=$1`, values: [to_user_id, amt] });
      await client.query('COMMIT');
      return NextResponse.json({ txId, ok: true });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      await client.end();
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
