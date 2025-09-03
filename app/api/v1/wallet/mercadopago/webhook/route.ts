import { NextRequest, NextResponse } from "next/server";
import database from "@/infra/database";

// NOTE: In production, validate signatures from Mercado Pago.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { txId, status, provider_tx_id } = body; // Map from MP notification to your record
    if (!txId) return NextResponse.json({ error: 'txId required' }, { status: 400 });

    // Fetch transaction
    const txRes = await database.query({ text: `SELECT * FROM wallet_transactions WHERE id = $1`, values: [txId] });
    const tx = txRes.rows[0];
    if (!tx) return NextResponse.json({ error: 'not found' }, { status: 404 });
    if (tx.status === 'confirmed') return NextResponse.json({ ok: true });

    if (status === 'approved' || status === 'confirmed') {
      // Credit wallet balance in a single transaction
      const client = await database.getNewClient();
      try {
        await client.query('BEGIN');
        await client.query({
          text: `UPDATE wallet_transactions SET status='confirmed', external_ref=$2, updated_at=NOW() WHERE id=$1`,
          values: [txId, provider_tx_id || null],
        });
        await client.query({
          text: `INSERT INTO wallets (user_id, balance_cents, currency) VALUES ($1, $2, $3)
                 ON CONFLICT (user_id) DO UPDATE SET balance_cents = wallets.balance_cents + EXCLUDED.balance_cents, updated_at=NOW()`,
          values: [tx.to_user_id, tx.amount_cents, tx.currency],
        });
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        await client.end();
      }
      return NextResponse.json({ ok: true });
    } else if (status === 'failed' || status === 'cancelled') {
      await database.query({
        text: `UPDATE wallet_transactions SET status=$2, updated_at=NOW() WHERE id=$1`,
        values: [txId, 'failed'],
      });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
