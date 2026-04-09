import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseAppSavedJson, type AppSavedJson } from "@/domain/app-saved";
import { calcFireBattery } from "@/domain/fire-battery/calc";
import { buildFireBatteryReportDocBuffer } from "@/lib/fire-battery-report-docx";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { inputs?: AppSavedJson };
  const parsed = parseAppSavedJson(body.inputs ?? null);
  if (!parsed) return NextResponse.json({ error: "invalid_inputs" }, { status: 400 });

  try {
    const fb = parsed.fireBattery;
    const results = calcFireBattery(fb);
    const buf = await buildFireBatteryReportDocBuffer(
      parsed.projectMeta,
      fb,
      results,
    );

    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "content-type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "content-disposition":
          'attachment; filename="bang-tinh-bao-chay-tu-dong.docx"',
      },
    });
  } catch (err) {
    console.error("[api/export/word-fire] failed", err);
    return NextResponse.json({ error: "export_failed" }, { status: 500 });
  }
}
