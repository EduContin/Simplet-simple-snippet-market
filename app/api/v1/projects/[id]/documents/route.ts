import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import database from "@/infra/database";
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session: any = await getServerSession(authOptions as any);
  const meId = session?.user?.id;
  if (!meId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = Number(params.id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  // Owner-only upload
  const owner = await database.query({ text: `SELECT owner_user_id FROM projects WHERE id = $1`, values: [id] });
  if (owner.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (Number(owner.rows[0].owner_user_id) !== Number(meId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const form = await request.formData();
    const file = form.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'file required' }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const safeName = `${Date.now()}_${(file.name || 'document').replace(/[^a-zA-Z0-9._-]/g, '-')}`;
    const dir = path.join(process.cwd(), 'storage', 'projects', String(id));
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, safeName);
    fs.writeFileSync(filePath, buffer);

    const ins = await database.query({
      text: `INSERT INTO project_documents (project_id, filename, url, storage_path) VALUES ($1, $2, $3, $4) RETURNING id`,
      values: [id, file.name, '', filePath],
    });
    const docId = ins.rows[0].id;
    const apiUrl = `/api/v1/projects/${id}/documents/${docId}/download`;
    await database.query({ text: `UPDATE project_documents SET url = $1 WHERE id = $2`, values: [apiUrl, docId] });

    return NextResponse.json({ ok: true, url: apiUrl, id: docId });
  } catch (e) {
    console.error('POST /projects/:id/documents error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
