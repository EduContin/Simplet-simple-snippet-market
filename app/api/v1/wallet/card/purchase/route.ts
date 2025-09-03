import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import database from "@/infra/database";

export async function POST(request: NextRequest) {
  const session: any = await getServerSession(authOptions as any);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { payment_method_id, amount_cents, currency } = await request.json();
  if (!payment_method_id || !amount_cents) return NextResponse.json({ error: 'Missing payment_method_id/amount_cents' }, { status: 400 });
  const curr = currency || 'BRL';

  const client = await database.getNewClient();
  try {
    await client.query('BEGIN');
    // Validate ownership of payment method
    const pm = await client.query({ text: `SELECT id FROM payment_methods WHERE id=$1 AND user_id=$2`, values: [payment_method_id, session.user.id] });
    if (pm.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
    }

    // Create pending deposit transaction
    const txRes = await client.query({
      text: `INSERT INTO wallet_transactions (type, amount_cents, currency, status, to_user_id, metadata)
             VALUES ('deposit', $1, $2, 'pending', $3, $4)
             RETURNING id` ,
      values: [amount_cents, curr, session.user.id, { provider: 'card', payment_method_id }],
    });
    const txId = txRes.rows[0].id;

    // Here you would call your PSP to charge the card token. We'll simulate success.
    const chargeOk = true;
    if (!chargeOk) {
      await client.query({ text: `UPDATE wallet_transactions SET status='failed', updated_at=NOW() WHERE id=$1`, values: [txId] });
      await client.query('COMMIT');
      return NextResponse.json({ txId, ok: false, error: 'Charge failed' }, { status: 402 });
    }

    // Ensure wallet exists
    await client.query({ text: `INSERT INTO wallets (user_id, balance_cents, currency) VALUES ($1, 0, $2) ON CONFLICT (user_id) DO NOTHING`, values: [session.user.id, curr] });
    // Credit wallet and mark tx confirmed
    await client.query({ text: `UPDATE wallets SET balance_cents = balance_cents + $2, updated_at=NOW() WHERE user_id=$1`, values: [session.user.id, amount_cents] });
    await client.query({ text: `UPDATE wallet_transactions SET status='confirmed', updated_at=NOW() WHERE id=$1`, values: [txId] });

    await client.query('COMMIT');
    return NextResponse.json({ txId, ok: true });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  } finally {
    await client.end();
  }
}
