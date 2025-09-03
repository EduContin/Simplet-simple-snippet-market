import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import database from "@/infra/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";

// Generates a dynamic QR for requesting a P2P transfer to a username
export async function POST(request: NextRequest) {
  try {
    const session: any = await getServerSession(authOptions as any);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { to_username, amount_cents, currency } = await request.json();
    if (!to_username || !amount_cents) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const curr = currency || 'BRL';

    // Resolve recipient user id
    const userRes = await database.query({ text: `SELECT id FROM users WHERE username = $1`, values: [to_username] });
    if (userRes.rowCount === 0) return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
    const to_user_id = userRes.rows[0].id;

    // Create a dynamic payload for scanning and initiating transfer from scanner to recipient
    const payload = `simplet:transfer:${session.user.id}->${to_user_id}:${curr}:${amount_cents}:${Date.now()}`;
    const qrImageDataUrl = await QRCode.toDataURL(payload, { errorCorrectionLevel: 'M', margin: 1, width: 256 });
    return NextResponse.json({ payload, qrImageDataUrl });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
