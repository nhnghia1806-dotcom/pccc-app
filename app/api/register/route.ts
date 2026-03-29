import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/db";

type Body = {
  email?: string;
  password?: string;
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Body;
  const email = body.email?.toLowerCase().trim();
  const password = body.password ?? "";

  if (!email || !password || password.length < 8) {
    return NextResponse.json(
      { error: "Email hợp lệ và mật khẩu >= 8 ký tự là bắt buộc." },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  console.log('existing123', existing)
  if (existing) {
    return NextResponse.json(
      { error: "Email đã tồn tại." },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({ data: { email, passwordHash } });

  return NextResponse.json({ ok: true });
}

