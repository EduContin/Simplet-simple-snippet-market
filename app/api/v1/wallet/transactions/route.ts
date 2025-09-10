import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import database from '@/infra/database';

// GET /api/v1/wallet/transactions?limit=50
export async function GET(request: NextRequest) {
  const session: any = await getServerSession(authOptions as any);
  const meId = session?.user?.id;
  if (!meId) return NextResponse.json({ items: [] }, { status: 200 });

  const { searchParams } = new URL(request.url);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')||50)));
  try {
    const res = await database.query({
      text: `
        SELECT wt.*, fu.username AS from_username, tu.username AS to_username
        FROM wallet_transactions wt
        LEFT JOIN users fu ON fu.id = wt.from_user_id
        LEFT JOIN users tu ON tu.id = wt.to_user_id
        WHERE wt.from_user_id = $1 OR wt.to_user_id = $1
        ORDER BY wt.created_at DESC
        LIMIT $2
      `,
      values: [meId, limit],
    });
    return NextResponse.json({ items: res.rows });
  } catch (e) {
    console.error('wallet/transactions GET error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
