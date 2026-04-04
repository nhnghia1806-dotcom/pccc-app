import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseAppSavedJson } from "@/domain/app-saved";
import { calcPcccElectric } from "@/domain/pccc-electric/calc";
import { buildPumpStationElectricDocBuffer } from "@/lib/pump-station-electric-docx";

export async function POST() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const saved = await prisma.savedState.findUnique({ where: { userId: user.id } });
  const parsed = parseAppSavedJson(saved?.json ?? null);
  if (!parsed) return NextResponse.json({ error: "no_state" }, { status: 400 });

  const inputs = parsed.electric;
  const results = calcPcccElectric(inputs);
  const buf = await buildPumpStationElectricDocBuffer(
    parsed.projectMeta,
    inputs,
    results,
  );

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "content-type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "content-disposition": 'attachment; filename="bang-tinh-tram-bom-pccc.docx"',
    },
  });
}
