import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import database from "@/infra/database";

export async function GET(_request: NextRequest) {
  const session: any = await getServerSession(authOptions as any);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const res = await database.query({
    text: `SELECT id, provider, brand, last4, exp_month, exp_year FROM payment_methods WHERE user_id=$1 ORDER BY id DESC`,
    values: [session.user.id],
  });
  return NextResponse.json({ methods: res.rows });
}
