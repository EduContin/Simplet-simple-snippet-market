import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import database from "@/infra/database";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'open';
  const q = (searchParams.get('q') || '').trim();
  const limit = Math.min(Number(searchParams.get('limit') || 20), 100);
  const offset = Math.max(Number(searchParams.get('offset') || 0), 0);

  let where = 'WHERE status = $1';
  const values: any[] = [status];
  if (q) {
    values.push(`%${q.toLowerCase()}%`);
    where += ` AND (LOWER(title) LIKE $${values.length} OR LOWER(summary) LIKE $${values.length})`;
  }

  try {
    const res = await database.query({
      text: `SELECT id, title, summary, budget_cents, currency, status, created_at
             FROM projects
             ${where}
             ORDER BY created_at DESC
             LIMIT ${limit} OFFSET ${offset}`,
      values,
    });
    return NextResponse.json({ items: res.rows });
  } catch (e) {
    console.error('GET /projects error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session: any = await getServerSession(authOptions as any);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const title = (body.title || '').trim();
  const summary = (body.summary || '').trim();
  const description = (body.description || '').trim();
  const budget_cents = Number(body.budget_cents || 0);
  const currency = (body.currency || 'USD').toUpperCase();
  const nda_required = body.nda_required !== false; // default true

  if (!title || !summary || !description) {
    return NextResponse.json({ error: 'title, summary, and description are required' }, { status: 400 });
  }

  try {
    const res = await database.query({
      text: `INSERT INTO projects (owner_user_id, title, summary, description, budget_cents, currency, nda_required)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id`,
      values: [userId, title, summary, description, budget_cents, currency, nda_required],
    });
    return NextResponse.json({ id: res.rows[0].id }, { status: 201 });
  } catch (e) {
    console.error('POST /projects error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
