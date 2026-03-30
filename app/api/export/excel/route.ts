import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import ExcelJS from "exceljs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseAppSavedJson } from "@/domain/app-saved";
import { calcPcccElectric } from "@/domain/pccc-electric/calc";

function sheetAddLoads(
  ws: ExcelJS.Worksheet,
  title: string,
  items: { name: string; kw: number; quantity: number }[],
) {
  ws.addRow([title]);
  ws.addRow(["#", "Tên", "Công suất định mức (KW)", "Số lượng"]);
  items.forEach((x, idx) => ws.addRow([idx + 1, x.name, x.kw, x.quantity]));
  ws.addRow([]);
}

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

  const wb = new ExcelJS.Workbook();
  wb.creator = "PCCC Web";
  wb.created = new Date();

  const ws = wb.addWorksheet("PCCC - Điện");
  ws.columns = [
    { width: 6 },
    { width: 46 },
    { width: 14 },
    { width: 14 },
  ];

  ws.addRow(["TÍNH TOÁN PHỤ TẢI ĐIỆN PCCC"]);
  ws.addRow([]);

  ws.addRow(["Tham số"]);
  ws.addRow(["Kđt", inputs.kdt]);
  ws.addRow(["Kyc", inputs.kyc]);
  ws.addRow(["Kkđ", inputs.kkD]);
  ws.addRow(["cosφ", inputs.cosPhi]);
  ws.addRow(["kdp", inputs.kdp]);
  ws.addRow([]);

  sheetAddLoads(ws, "Nhóm bơm chữa cháy chính (PB)", inputs.pumpsMain);
  sheetAddLoads(ws, "Nhóm thiết bị khác (PBC)", inputs.otherLoads);

  ws.addRow(["Bơm dự phòng (máy phát)"]);
  ws.addRow(["#", "Tên", "Công suất định mức (KW)", "Số lượng"]);
  inputs.backupPumps.forEach((x, idx) =>
    ws.addRow([
      idx + 1,
      x.name,
      x.kw,
      typeof x.quantity === "number" && Number.isFinite(x.quantity) ? x.quantity : 1,
    ]),
  );
  ws.addRow([]);

  ws.addRow(["Kết quả"]);
  ws.addRow(["PB (kW)", results.pb]);
  ws.addRow(["PKHÁC (kW)", results.pkhac]);
  ws.addRow(["Ptt tổng — MBA: Kđt·(PB·Kkđ+PBC) (kW)", results.ptt]);
  ws.addRow(["SMBA (kVA)", results.smba]);
  ws.addRow(["Ptt nhóm bơm dự phòng (khác Ptt tổng) (kW)", results.pttBackup]);
  ws.addRow(["Pkđ (kW)", results.pkd]);
  ws.addRow(["Stt (kVA)", results.stt]);
  ws.addRow(["Skđ (kVA)", results.skd]);
  ws.addRow(["SMPĐ (kVA)", results.smpd]);

  const buf = await wb.xlsx.writeBuffer();
  return new NextResponse(Buffer.from(buf), {
    headers: {
      "content-type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": 'attachment; filename="pccc-dien.xlsx"',
    },
  });
}

