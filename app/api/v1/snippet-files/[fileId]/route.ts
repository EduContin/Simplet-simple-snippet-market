import { NextRequest, NextResponse } from "next/server";
import database from "@/infra/database";

export async function GET(_req: NextRequest, { params }: { params: { fileId: string } }) {
  const fileId = Number(params.fileId);
  if (!Number.isFinite(fileId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  try {
    const res = await database.query({
      text: `SELECT id, thread_id, filename, language, is_entry, content FROM snippet_files WHERE id = $1`,
      values: [fileId],
    });
    if (res.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(res.rows[0]);
  } catch (e) {
    console.error('GET /snippet-files/:id failed', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
