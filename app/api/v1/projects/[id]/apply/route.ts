import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import database from "@/infra/database";

const TERMS_VERSION = '2025-09-04';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session: any = await getServerSession(authOptions as any);
  const meId = session?.user?.id;
  if (!meId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = Number(params.id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  let cover_letter = '';
  let proposed_cents = 0;
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const body = await request.json();
    cover_letter = (body.cover_letter || '').trim();
    proposed_cents = Number(body.proposed_cents || 0);
  } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    cover_letter = String(form.get('cover_letter') || '').trim();
    proposed_cents = Math.round(Number(form.get('proposed') || 0) * 100);
  }

  const proj = await database.query({ text: `SELECT id FROM projects WHERE id = $1`, values: [id] });
  if (proj.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  try {
    const res = await database.query({
      text: `INSERT INTO project_applications (project_id, applicant_user_id, cover_letter, proposed_cents)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (project_id, applicant_user_id) DO UPDATE SET cover_letter = EXCLUDED.cover_letter, proposed_cents = EXCLUDED.proposed_cents
             RETURNING id` ,
      values: [id, meId, cover_letter, proposed_cents],
    });
    return NextResponse.json({ application_id: res.rows[0].id });
  } catch (e) {
    console.error('POST /projects/:id/apply error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
