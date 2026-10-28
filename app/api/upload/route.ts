import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Fichier manquant." }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Choisissez une image." }, { status: 400 });
  if (file.size > 3 * 1024 * 1024) return NextResponse.json({ error: "Image limitée à 3 Mo." }, { status: 400 });
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const folder = path.join(process.cwd(), "public", "uploads");
  await mkdir(folder, { recursive: true });
  const name = `${randomUUID()}.${ext}`;
  await writeFile(path.join(folder, name), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ url: `/uploads/${name}` });
}
