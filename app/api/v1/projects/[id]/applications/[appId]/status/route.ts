import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import database from "@/infra/database";

export async function POST(request: NextRequest, { params }: { params: { id: string, appId: string } }) {
  const session: any = await getServerSession(authOptions as any);
  const meId = session?.user?.id;
  if (!meId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const projectId = Number(params.id);
  const appId = Number(params.appId);
  if (!Number.isFinite(projectId) || !Number.isFinite(appId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const body = await request.formData();
  const status = String(body.get('status') || '').trim();
  const allowed = new Set(['accepted', 'rejected']);
  if (!allowed.has(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });

  // Owner only
  const owner = await database.query({ text: `SELECT owner_user_id FROM projects WHERE id = $1`, values: [projectId] });
  if (owner.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (Number(owner.rows[0].owner_user_id) !== Number(meId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    if (status === 'accepted') {
      // Mark this application as accepted, set project chosen applicant and status
      await database.withTransaction(async (client) => {
        const app = await database.queryWithClient(client, { text: `SELECT id FROM project_applications WHERE id = $1 AND project_id = $2`, values: [appId, projectId] });
        if (app.rowCount === 0) throw new Error('Application not found');
        await database.queryWithClient(client, { text: `UPDATE project_applications SET status = 'accepted' WHERE id = $1`, values: [appId] });
        await database.queryWithClient(client, { text: `UPDATE projects SET chosen_application_id = $1, status = 'in_progress', started_at = NOW() WHERE id = $2`, values: [appId, projectId] });
      });
    } else {
      await database.query({ text: `UPDATE project_applications SET status = 'rejected' WHERE id = $1 AND project_id = $2`, values: [appId, projectId] });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('POST /projects/:id/applications/:appId/status error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
