import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import database from "@/infra/database";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session: any = await getServerSession(authOptions as any);
  const meId = session?.user?.id;
  if (!meId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = Number(params.id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const body = await request.formData();
  const status = String(body.get('status') || '').trim();
  const allowed = new Set(['open', 'in_progress', 'closed']);
  if (!allowed.has(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });

  // Owner only
  const owner = await database.query({ text: `SELECT owner_user_id FROM projects WHERE id = $1`, values: [id] });
  if (owner.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (Number(owner.rows[0].owner_user_id) !== Number(meId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    await database.query({ text: `UPDATE projects SET status = $1, updated_at = NOW() WHERE id = $2`, values: [status, id] });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('POST /projects/:id/status error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
