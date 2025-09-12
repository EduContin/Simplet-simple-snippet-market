import { NextRequest, NextResponse } from "next/server";
import database from "@/infra/database";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const threadId = Number(params.id);
  if (!Number.isFinite(threadId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  try {
    const res = await database.query({
      text: `SELECT id, filename, language, is_entry, length(content) as size FROM snippet_files WHERE thread_id = $1 ORDER BY is_entry DESC, filename ASC`,
      values: [threadId],
    });
    return NextResponse.json(res.rows);
  } catch (e) {
    console.error('GET /threads/:id/files failed', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
