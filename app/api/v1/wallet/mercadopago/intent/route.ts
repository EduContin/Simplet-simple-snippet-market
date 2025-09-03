import { NextRequest, NextResponse } from "next/server";
import database from "@/infra/database";
import QRCode from "qrcode";

export async function POST(request: NextRequest) {
  try {
    const { userId, amount_cents, currency, method } = await request.json();
    if (!userId || !amount_cents) return NextResponse.json({ error: "userId and amount_cents required" }, { status: 400 });
    const curr = currency || 'BRL';
    const paymentMethod = method || 'pix'; // 'pix' or 'card'

    // Create pending transaction record
    const tx = await database.query({
      text: `INSERT INTO wallet_transactions (type, amount_cents, currency, status, to_user_id, metadata)
             VALUES ('deposit', $1, $2, 'pending', $3, $4)
             RETURNING id`,
      values: [amount_cents, curr, userId, { provider: 'mercadopago', method: paymentMethod }],
    });
    const txId = tx.rows[0].id;

  // Build a dynamic payload for this deposit intent.
  // NOTE: In production, replace with PSP-provided payload (e.g., Mercado Pago PIX copy&paste)
  const payload = `simplet:deposit:${txId}:${curr}:${amount_cents}:${Date.now()}`;
  const qrImageDataUrl = await QRCode.toDataURL(payload, { errorCorrectionLevel: 'M', margin: 1, width: 256 });

  return NextResponse.json({ txId, payload, qrImageDataUrl });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
