import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import database from '@/infra/database';

// POST /api/v1/checkout -> processes all cart items atomically, transfers funds to snippet owners, records ownership, empties cart.
export async function POST() {
  const session: any = await getServerSession(authOptions as any);
  const meId = session?.user?.id;
  if (!meId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const result = await database.withTransaction(async (client) => {
      // Lock cart items for this user
      const cart = await client.query({
        text: `SELECT ci.thread_id, ci.price_cents, t.user_id AS seller_id
               FROM cart_items ci
               JOIN threads t ON t.id = ci.thread_id
               WHERE ci.user_id = $1
               FOR UPDATE`,
        values: [meId],
      });
      if (cart.rowCount === 0) return { purchased: [], total_cents: 0 };

      // Fetch wallet balance (and lock)
      const w = await client.query({
        text: `SELECT balance_cents, currency FROM wallets WHERE user_id = $1 FOR UPDATE`,
        values: [meId],
      });
      if (w.rowCount === 0) {
        throw new Error('Wallet not found');
      }
      const { balance_cents, currency } = w.rows[0];
      const total = cart.rows.reduce((s, r) => s + Number(r.price_cents || 0), 0);
      if (total > balance_cents) {
        return { error: 'INSUFFICIENT_FUNDS', needed_cents: total, balance_cents };
      }

      const purchased: any[] = [];
  for (const row of cart.rows) {
        const threadId = Number(row.thread_id);
        const sellerId = Number(row.seller_id);
        const priceCents = Number(row.price_cents || 0);
        if (sellerId === meId) continue; // skip own threads just in case
        // Ensure we don't already have ownership
        const existing = await client.query({
          text: `SELECT id FROM snippet_purchases WHERE buyer_user_id=$1 AND thread_id=$2`,
          values: [meId, threadId],
        });
        if (existing.rowCount === 0) {
          await client.query({
            text: `INSERT INTO snippet_purchases (buyer_user_id, thread_id, price_cents, currency) VALUES ($1,$2,$3,$4)`,
            values: [meId, threadId, priceCents, currency],
          });
          // Credit seller wallet & debit buyer wallet
          if (priceCents > 0) {
            // Lock seller wallet too
            await client.query({ text: `INSERT INTO wallets (user_id, balance_cents, currency) VALUES ($1,0,$2) ON CONFLICT (user_id) DO NOTHING`, values: [sellerId, currency] });
            await client.query({ text: `UPDATE wallets SET balance_cents = balance_cents + $2, updated_at=NOW() WHERE user_id=$1`, values: [sellerId, priceCents] });
            // Record credit to seller
            await client.query({
              text: `INSERT INTO wallet_transactions (type, amount_cents, currency, status, from_user_id, to_user_id, metadata)
                     VALUES ('transfer', $1, $2, 'confirmed', $3, $4, $5)`,
              values: [priceCents, currency, meId, sellerId, { context: 'snippet_purchase', thread_id: threadId }],
            });
          }
          purchased.push({ thread_id: threadId, price_cents: priceCents });
        }
      }

      // Debit buyer for total (after computing) only once
      if (purchased.length) {
        const debit = purchased.reduce((s, p) => s + p.price_cents, 0);
        if (debit > 0) {
          await client.query({ text: `UPDATE wallets SET balance_cents = balance_cents - $2, updated_at=NOW() WHERE user_id=$1`, values: [meId, debit] });
          // Record consolidated debit from buyer
          await client.query({
            text: `INSERT INTO wallet_transactions (type, amount_cents, currency, status, from_user_id, to_user_id, metadata)
                   VALUES ('transfer', $1, $2, 'confirmed', $3, NULL, $4)`,
            values: [debit, currency, meId, { context: 'snippet_purchase_total' }],
          });
        }
      }
      // Empty cart
      await client.query({ text: `DELETE FROM cart_items WHERE user_id = $1`, values: [meId] });
      return { purchased, total_cents: purchased.reduce((s,p)=>s+p.price_cents,0) };
    });

    if ((result as any).error === 'INSUFFICIENT_FUNDS') {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error('Checkout POST error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
