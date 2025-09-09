import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import database from "@/infra/database";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const session: any = await getServerSession(authOptions as any);
  const meId = session?.user?.id;
  if (!meId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = Number(params.id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  // Owner only
  const owner = await database.query({ text: `SELECT owner_user_id FROM projects WHERE id = $1`, values: [id] });
  if (owner.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (Number(owner.rows[0].owner_user_id) !== Number(meId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const res = await database.query({
      text: `SELECT pa.id, pa.applicant_user_id, u.username, pa.cover_letter, pa.proposed_cents, pa.status, pa.nda_accepted, pa.contractor_terms_accepted, pa.nda_accepted_at, pa.terms_version, pa.accept_ip, pa.accept_user_agent, pa.created_at
             FROM project_applications pa JOIN users u ON u.id = pa.applicant_user_id
             WHERE pa.project_id = $1 ORDER BY pa.created_at DESC`,
      values: [id],
    });
    return NextResponse.json({ items: res.rows });
  } catch (e) {
    console.error('GET /projects/:id/applications error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
