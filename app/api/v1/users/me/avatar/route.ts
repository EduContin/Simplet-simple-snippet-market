import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import fs from "fs";
import path from "path";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

import database from "@/infra/database";

export async function POST(req: NextRequest) {
  const session: any = await getServerSession(authOptions as any);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "file is required" }, { status: 400 });
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }
    const bytes = await file.arrayBuffer();
    if (bytes.byteLength > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "avatars");
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const safeName = `${session.user.id}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
    const fullPath = path.join(uploadsDir, safeName);
  await fs.promises.writeFile(fullPath, new Uint8Array(bytes));

    const publicUrl = `/uploads/avatars/${safeName}`;
    await database.query({
      text: `UPDATE users SET avatar_url = $1 WHERE id = $2`,
      values: [publicUrl, session.user.id],
    });

    return NextResponse.json({ ok: true, url: publicUrl });
  } catch (e) {
    console.error("avatar upload error", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
