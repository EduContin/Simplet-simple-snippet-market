import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import fs from "fs";
import path from "path";
import database from "@/infra/database";

export const runtime = "nodejs";

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function saveFile(file: File, subdir: string): Promise<string> {
  const arr = new Uint8Array(await file.arrayBuffer());
  const uploadsDir = path.join(process.cwd(), "public", "uploads", subdir);
  ensureDir(uploadsDir);
  const ext = path.extname(file.name) || ".bin";
  const base = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const filename = `${base}${ext}`;
  const fullPath = path.join(uploadsDir, filename);
  fs.writeFileSync(fullPath, arr);
  const webPath = `/uploads/${subdir}/${filename}`;
  return webPath;
}

export async function POST(req: NextRequest) {
  const session: any = await getServerSession(authOptions as any);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const kind = String(form.get("kind") || "avatar"); // 'avatar' | 'banner'
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "file required" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });

  try {
    const sub = kind === "banner" ? "banners" : "avatars";
    const url = await saveFile(file, sub);
    const column = kind === "banner" ? "banner_url" : "avatar_url";
    await database.query({
      text: `UPDATE users SET ${column} = $1 WHERE id = $2`,
      values: [url, session.user.id],
    });
    return NextResponse.json({ ok: true, url });
  } catch (e) {
    console.error("Upload error", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
