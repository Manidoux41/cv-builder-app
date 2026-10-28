import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { defaultResume } from "@/lib/default-resume";

export async function GET() {
  try {
    const resume = await prisma.resume.findFirst({ orderBy: { updatedAt: "desc" } });
    return NextResponse.json(resume ?? { id: "local-default", title: "Mon CV", data: defaultResume });
  } catch {
    return NextResponse.json({ id: "local-default", title: "Mon CV", data: defaultResume });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = body.data;
    if (!data || typeof data !== "object") return NextResponse.json({ error: "Données de CV manquantes." }, { status: 400 });
    const existing = body.id && body.id !== "local-default"
      ? await prisma.resume.findUnique({ where: { id: body.id } }) : null;
    const resume = existing
      ? await prisma.resume.update({ where: { id: existing.id }, data: { title: body.title || "Mon CV", data } })
      : await prisma.resume.create({ data: { title: body.title || "Mon CV", data } });
    return NextResponse.json(resume);
  } catch (error) {
    console.error("CV save failed:", error);
    return NextResponse.json({ error: "Impossible d'enregistrer. Vérifiez la configuration de la base de données." }, { status: 500 });
  }
}
