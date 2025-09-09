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

  const proj = await database.query({ text: `SELECT nda_required FROM projects WHERE id = $1`, values: [id] });
  if (proj.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!proj.rows[0].nda_required) return NextResponse.json({ error: 'NDA not required' }, { status: 400 });

  const app = await database.query({ text: `SELECT id, status FROM project_applications WHERE project_id = $1 AND applicant_user_id = $2`, values: [id, meId] });
  if (app.rowCount === 0) return NextResponse.json({ error: 'No application found' }, { status: 404 });
  if (app.rows[0].status !== 'accepted') return NextResponse.json({ error: 'Not authorized to accept NDA' }, { status: 403 });

  const ua = request.headers.get('user-agent') || null;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;

  await database.query({
    text: `UPDATE project_applications SET nda_accepted = true, nda_accepted_at = NOW(), accept_ip = $1, accept_user_agent = $2 WHERE id = $3`,
    values: [ip, ua, app.rows[0].id],
  });

  return NextResponse.json({ ok: true });
}