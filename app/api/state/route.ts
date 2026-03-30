import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { AppSavedJson } from "@/domain/app-saved";

export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const saved = await prisma.savedState.findUnique({ where: { userId: user.id } });
  if (!saved) return NextResponse.json({ inputs: null });

  return NextResponse.json({ inputs: saved.json as unknown as AppSavedJson });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { inputs?: AppSavedJson };
  if (!body.inputs) return NextResponse.json({ error: "inputs_required" }, { status: 400 });

  await prisma.savedState.upsert({
    where: { userId: user.id },
    update: { json: body.inputs as unknown as object },
    create: { userId: user.id, json: body.inputs as unknown as object },
  });

  return NextResponse.json({ ok: true });
}

