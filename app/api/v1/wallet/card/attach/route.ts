import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import database from "@/infra/database";

// Attach a card tokenized by a PSP. We store only a token + display info.
export async function POST(request: NextRequest) {
  const session: any = await getServerSession(authOptions as any);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { token, brand, last4, exp_month, exp_year, provider } = await request.json();
  if (!token || !last4) return NextResponse.json({ error: 'Missing card token/last4' }, { status: 400 });
  const prov = provider || 'custom';
  await database.query({
    text: `INSERT INTO payment_methods (user_id, provider, external_id, brand, last4, exp_month, exp_year)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    values: [session.user.id, prov, token, brand, last4, exp_month, exp_year],
  });
  return NextResponse.json({ ok: true });
}
