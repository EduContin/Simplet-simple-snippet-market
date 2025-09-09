import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import database from "@/infra/database";

const NDA_TEXT = `Mutual NDA (Short Form)\n\n1. Confidential Information includes any non-public information disclosed for the purpose of evaluating and/or performing the Project.\n2. Receiving Party will not disclose or use Confidential Information except for the Project.\n3. Confidentiality obligations survive 3 years.\n4. No license or assignment is granted by this NDA.\n5. Return or destroy Confidential Information upon request.\n`;

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session: any = await getServerSession(authOptions as any);
  const meId = session?.user?.id;
  const id = Number(params.id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  try {
    const p = await database.query({
      text: `SELECT id, owner_user_id, title, summary, description, budget_cents, currency, nda_required, status, created_at, chosen_application_id, started_at, completed_at
             FROM projects WHERE id = $1`,
      values: [id],
    });
    if (p.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const proj = p.rows[0];
    const is_owner = meId && (Number(proj.owner_user_id) === Number(meId));

    // Get current user's application (if any)
    let my_application: any = null;
    if (meId) {
      const my = await database.query({
        text: `SELECT id, status, nda_accepted, nda_accepted_at FROM project_applications WHERE project_id = $1 AND applicant_user_id = $2`,
        values: [id, meId],
      });
      if (my.rowCount > 0) my_application = my.rows[0];
    }

    // Documents visibility: owner or NDA-accepted applicant
    let documents: any[] = [];
    // Only owner or accepted applicant can view documents; if NDA required, applicant must also have accepted NDA
    let can_view_documents = false;
    if (is_owner) {
      can_view_documents = true;
    } else if (my_application && my_application.status === 'accepted') {
      can_view_documents = proj.nda_required ? !!my_application.nda_accepted : true;
    }

  if (can_view_documents) {
      const d = await database.query({
        text: `SELECT id, filename, created_at FROM project_documents WHERE project_id = $1 ORDER BY created_at DESC`,
        values: [id],
      });
      documents = d.rows.map((r: any) => ({ ...r, url: `/api/v1/projects/${id}/documents/${r.id}/download` }));
    }

  // Only include NDA text for accepted applicant who hasn't accepted NDA yet
  const nda_text = (proj.nda_required && my_application && my_application.status === 'accepted' && !my_application.nda_accepted) ? NDA_TEXT : null;
  return NextResponse.json({ ...proj, nda_text, is_owner: !!is_owner, can_view_documents, documents, my_application });
  } catch (e) {
    console.error('GET /projects/:id error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
