import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import database from "@/infra/database";
import fs from 'fs';

export const runtime = 'nodejs';

export async function GET(_request: NextRequest, { params }: { params: { id: string, docId: string } }) {
  const session: any = await getServerSession(authOptions as any);
  const meId = session?.user?.id;
  if (!meId) return new NextResponse('Unauthorized', { status: 401 });
  const projectId = Number(params.id);
  const docId = Number(params.docId);
  if (!Number.isFinite(projectId) || !Number.isFinite(docId)) return new NextResponse('Invalid id', { status: 400 });

  // Check access: owner or NDA-accepted applicant
  const project = await database.query({ text: `SELECT owner_user_id, nda_required FROM projects WHERE id = $1`, values: [projectId] });
  if (project.rowCount === 0) return new NextResponse('Not found', { status: 404 });

  let allowed = false;
  if (Number(project.rows[0].owner_user_id) === Number(meId)) {
    allowed = true;
  } else {
    const app = await database.query({ text: `SELECT status, nda_accepted FROM project_applications WHERE project_id = $1 AND applicant_user_id = $2`, values: [projectId, meId] });
    if (app.rowCount > 0 && app.rows[0].status === 'accepted' && (project.rows[0].nda_required ? app.rows[0].nda_accepted : true)) {
      allowed = true;
    }
  }
  if (!allowed) return new NextResponse('Forbidden', { status: 403 });

  const doc = await database.query({ text: `SELECT filename, storage_path FROM project_documents WHERE id = $1 AND project_id = $2`, values: [docId, projectId] });
  if (doc.rowCount === 0) return new NextResponse('Not found', { status: 404 });
  const { filename, storage_path } = doc.rows[0];
  if (!storage_path || !fs.existsSync(storage_path)) return new NextResponse('File missing', { status: 404 });

  const file = await fs.promises.readFile(storage_path);
  const data = new Uint8Array(file);
  return new NextResponse(data, {
    status: 200,
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename.replace(/"/g, '')}"`,
      'Content-Length': String(data.byteLength),
      'Cache-Control': 'no-store',
    },
  });
}
