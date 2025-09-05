import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import database from "@/infra/database";

export async function GET() {
  const session: any = await getServerSession(authOptions as any);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const res = await database.query({
      text: `SELECT id, username, avatar_url, banner_url, user_group, created_at
             FROM users WHERE id = $1`,
      values: [userId],
    });
    if (res.rowCount === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(res.rows[0]);
  } catch (e) {
    console.error("GET /api/v1/users/me error", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
