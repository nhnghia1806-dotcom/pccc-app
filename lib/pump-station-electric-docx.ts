import type { ProjectMeta } from "@/domain/app-saved";
import type { Inputs, Results } from "@/domain/pccc-electric/models";
import { formatCalcNumber } from "@/domain/pccc-electric/format-calc-number";
import {
  AlignmentType,
  BorderStyle,
  Document,
  LineRuleType,
  Math as DocxMath,
  MathRun,
  MathSubScript,
  MathSum,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  convertInchesToTwip,
  IRunOptions,
} from "docx";

const FONT = "Times New Roman";
/** Cỡ chữ nội dung — 13 pt (Word: half-points) */
const SZ_BODY = 26;
/** Tiêu đề báo cáo — 18 pt */
const SZ_TITLE = 36;
/** Mục I — 15 pt */
const SZ_H1 = 30;
/** Mục 1.1, 1.2, 2.3 — 14 pt */
const SZ_H2 = 28;

/** Lề trang (cm → twip): trái rộng hơn để đóng quyển */
const PAGE_MARGIN = {
  top: convertInchesToTwip(2.5 / 2.54),
  right: convertInchesToTwip(2 / 2.54),
  bottom: convertInchesToTwip(2.5 / 2.54),
  left: convertInchesToTwip(3 / 2.54),
};

/** Thụt khối công thức / “Trong đó” cấp 1 (~1 cm) */
const INDENT_BLOCK = convertInchesToTwip(1 / 2.54);
/** Thụt giải thích con (~1,5 cm) */
const INDENT_SUB = convertInchesToTwip(1.5 / 2.54);

const LINE_BODY = {
  line: 276,
  lineRule: LineRuleType.AUTO,
} as const;

/** Cùng quy tắc với `sumKw` trong `domain/pccc-electric/calc.ts`. */
function deriveLoadLine(x: { kw: number; quantity?: number }) {
  const kw = Number.isFinite(x.kw) ? x.kw : 0;
  const quantity = Number.isFinite(x.quantity) ? Number(x.quantity) : 1;
  const qty = Math.max(0, quantity);
  return { kw, qty, linePi: kw * qty };
}

const tr = (text: string, opts?: IRunOptions) => {
  return new TextRun({
    text,
    font: FONT,
    size: SZ_BODY,
    ...opts,
  });
};

function sub(base: string, subText: string, italics = true) {
  return [
    new TextRun({ text: base, font: FONT, size: SZ_BODY, italics }),
    new TextRun({
      text: subText,
      font: FONT,
      size: SZ_BODY,
      subScript: true,
      italics,
    }),
  ];
}

/** Chỉ số dưới trong phương trình Word (OMML). */
function mathSub(base: string, subText: string) {
  return new MathSubScript({
    children: [new MathRun(base)],
    subScript: [new MathRun(subText)],
  });
}

/**
 * P_B = K_yc · ∑_{i=1}^{n} P_i — dùng OMML nên Word hiển thị ∑ có cận trên/dưới
 * (giống KaTeX / trình soạn thảo công thức).
 */
function omathPbEqualsKycSumPi() {
  return new DocxMath({
    children: [
      mathSub("P", "tt"),
      new MathRun("="),
      mathSub("K", "yc"),
      new MathRun("⋅"),
      new MathSum({
        subScript: [new MathRun("i=1")],
        superScript: [new MathRun("n")],
        children: [mathSub("P", "i")],
      }),
    ],
  });
}

function omathPttEqualsKycSumPi() {
  return new DocxMath({
    children: [
      mathSub("P", "tt"),
      new MathRun("="),
      mathSub("K", "yc"),
      new MathRun("⋅"),
      new MathSum({
        subScript: [new MathRun("i=1")],
        superScript: [new MathRun("n")],
        children: [mathSub("P", "i")],
      }),
    ],
  });
}

function omathPkdEqualsKkdSumPi() {
  return new DocxMath({
    children: [
      mathSub("P", "kđ"),
      new MathRun("="),
      mathSub("K", "kđ"),
      new MathRun("⋅"),
      new MathSum({
        subScript: [new MathRun("i=1")],
        superScript: [new MathRun("n")],
        children: [mathSub("P", "i")],
      }),
    ],
  });
}

const border = {
  style: BorderStyle.SINGLE,
  size: 1,
  color: "000000",
} as const;

const TABLE_BORDERS = {
  top: border,
  bottom: border,
  left: border,
  right: border,
  insideHorizontal: border,
  insideVertical: border,
};

function tableCell(
  text: string,
  bold: boolean,
  opts?: { columnSpan?: number; header?: boolean },
): TableCell {
  const isHeader = opts?.header === true;
  const columnSpan = opts?.columnSpan;
  return new TableCell({
    ...(columnSpan != null ? { columnSpan } : {}),
    shading: isHeader
      ? { type: ShadingType.CLEAR, fill: "E8E8E8" }
      : undefined,
    children: [
      new Paragraph({
        alignment: isHeader ? AlignmentType.CENTER : AlignmentType.LEFT,
        spacing: { after: 0, before: 0, ...LINE_BODY },
        children: [tr(text, { bold: bold || isHeader })],
      }),
    ],
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
  });
}

function buildLoadsTable(
  loads: { name: string; kw: number; quantity?: number }[],
): Table {
  const header = new TableRow({
    tableHeader: true,
    children: [
      tableCell("Stt", true, { header: true }),
      tableCell("Tên phụ tải", true, { header: true }),
      tableCell("Công suất định mức 1 thiết bị (kW)", true, { header: true }),
      tableCell("Số lượng", true, { header: true }),
      tableCell("Tổng công suất định mức Pi (kW)", true, { header: true }),
    ],
  });

  const rows: TableRow[] = [header];

  if (loads.length === 0) {
    rows.push(
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 5,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { ...LINE_BODY, after: 80 },
                children: [
                  tr("Chưa có thiết bị trong danh mục.", { italics: true }),
                ],
              }),
            ],
            margins: { top: 80, bottom: 80, left: 100, right: 100 },
          }),
        ],
      }),
    );
  } else {
    loads.forEach((x, i) => {
      const { kw, qty, linePi } = deriveLoadLine(x);
      rows.push(
        new TableRow({
          children: [
            tableCell(String(i + 1), false),
            tableCell(x.name.trim() || "—", false),
            tableCell(formatCalcNumber(kw), false),
            tableCell(String(qty), false),
            tableCell(formatCalcNumber(linePi), false),
          ],
        }),
      );
    });
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [720, 3240, 2160, 1080, 2340],
    rows,
    borders: TABLE_BORDERS,
  });
}

function kycExplanationParagraph(kycStr: string): Paragraph {
  return new Paragraph({
    spacing: { after: 120, ...LINE_BODY },
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: INDENT_SUB },
    children: [
      ...sub("K", "yc", false),
      tr(` - Hệ số yêu cầu của phụ tải PCCC, `),
      ...sub("K", "yc", false),
      tr(
        ` = ${kycStr} (Căn cứ TCVN 9206:2012, 5.10. Khi xác định công suất tính toán của các động cơ điện của thiết bị chữa cháy, phải lấy hệ số yêu cầu bằng 1 với số lượng động cơ bất kỳ).`,
      ),
    ],
  });
}

/** Công thức P_tt = K_yc · ∑ P_i — OMML, cận ∑ hiển thị trên/dưới trong Word. */
function formulaPbParagraph(): Paragraph {
  return new Paragraph({
    spacing: { after: 180, before: 40, ...LINE_BODY },
    indent: { left: INDENT_BLOCK },
    children: [omathPbEqualsKycSumPi()],
  });
}

export async function buildPumpStationElectricDocBuffer(
  pm: ProjectMeta,
  inputs: Inputs,
  results: Results,
): Promise<Buffer> {
  const kycStr = formatCalcNumber(inputs.kyc);
  const kkDStr = formatCalcNumber(inputs.kkD);
  const cosStr = formatCalcNumber(inputs.cosPhi);
  const kdpStr = formatCalcNumber(inputs.kdp);
  const sumPiStr = formatCalcNumber(results.sumPi);
  const pttStr = formatCalcNumber(results.ptt);
  const smbaStr = formatCalcNumber(results.smba);
  const pttBackupStr = formatCalcNumber(results.pttBackup);
  const pkdStr = formatCalcNumber(results.pkd);
  const sttStr = formatCalcNumber(results.stt);
  const skdStr = formatCalcNumber(results.skd);
  const smpdStr = formatCalcNumber(results.smpd);

  const sumBackupKw = inputs.backupPumps.reduce(
    (a, x) => a + deriveLoadLine(x).linePi,
    0,
  );
  const sumBackupKwStr = formatCalcNumber(sumBackupKw);

  const metaBlock: Paragraph[] = [
    new Paragraph({
      spacing: { after: 100, ...LINE_BODY },
      alignment: AlignmentType.JUSTIFIED,
      children: [
        tr("Công trình: ", { bold: true }),
        tr(pm.congTrinh.trim() || ""),
      ],
    }),
    new Paragraph({
      spacing: { after: 100, ...LINE_BODY },
      alignment: AlignmentType.JUSTIFIED,
      children: [
        tr("Địa điểm: ", { bold: true }),
        tr(pm.diaDiem.trim() || ""),
      ],
    }),
    new Paragraph({
      spacing: { after: 100, ...LINE_BODY },
      alignment: AlignmentType.JUSTIFIED,
      children: [
        tr("Chủ đầu tư: ", { bold: true }),
        tr(pm.chuDauTu.trim() || ""),
      ],
    }),
    new Paragraph({
      spacing: { after: 320, ...LINE_BODY },
      alignment: AlignmentType.JUSTIFIED,
      children: [
        tr("Đơn vị tư vấn thiết kế: ", { bold: true }),
        tr(pm.donViTuVanThietKe.trim() || ""),
      ],
    }),
  ];

  const title = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 400, line: 360, lineRule: LineRuleType.AUTO },
    children: [
      tr("KẾT QUẢ TÍNH TOÁN NGUỒN CẤP ĐIỆN CHO TRẠM BƠM PHỤC VỤ CHỮA CHÁY", {
        bold: true,
        size: SZ_TITLE,
        font: FONT,
      }),
    ],
  });

  const h11 = new Paragraph({
    spacing: { before: 280, after: 200, ...LINE_BODY },
    outlineLevel: 0,
    children: [
      tr("I. TÍNH TOÁN, LỰA CHỌN NGUỒN CẤP ĐIỆN CHO TRẠM BƠM PHỤC VỤ CHỮA CHÁY", {
        bold: true,
        size: SZ_H1,
        font: FONT,
      }),
    ],
  });

  const h21 = new Paragraph({
    spacing: { before: 200, after: 160, ...LINE_BODY },
    keepNext: true,
    outlineLevel: 1,
    children: [
      tr("1.1. Thông số của các phụ tải", {
        bold: true,
        size: SZ_H2,
        font: FONT,
      }),
    ],
  });

  const tblMain = buildLoadsTable(inputs.pumpsMain);

  const h22 = new Paragraph({
    spacing: { before: 320, after: 180, ...LINE_BODY },
    outlineLevel: 1,
    children: [
      tr("1.2. Tính toán nguồn điện chính", {
        bold: true,
        size: SZ_H2,
        font: FONT,
      }),
    ],
  });

  const p22Lead = new Paragraph({
    spacing: { after: 140, ...LINE_BODY },
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: INDENT_BLOCK },
    children: [
      tr("- Tính công suất tính toán của nhóm phụ tải bơm nước chữa cháy:", { bold: true }),
    ],
  });

  const formulaPB = formulaPbParagraph();

  const trongDo = new Paragraph({
    spacing: { after: 80, ...LINE_BODY },
    indent: { left: INDENT_BLOCK },
    children: [tr("Trong đó:", { bold: true })],
  });

  const nExpl = new Paragraph({
    spacing: { after: 80, ...LINE_BODY },
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: INDENT_SUB },
    children: [tr("n - Số động cơ, phụ tải;")],
  });

  const piExpl = new Paragraph({
    spacing: { after: 140, ...LINE_BODY },
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: INDENT_SUB },
    children: [
      ...sub("P", "i"),
      tr(" - Công suất điện định mức (kW) của bơm thứ i."),
    ],
  });

  const pCalcPB = new Paragraph({
    spacing: { after: 200, ...LINE_BODY },
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: INDENT_BLOCK },
    children: [
      tr("→ "),
      ...sub("P", "tt"),
      tr(` = `),
      ...sub("K", "yc"),
      tr(` · ∑`),
      ...sub("P", "i"),
      tr(` = ${kycStr} × ${sumPiStr} = `),
      tr(`${pttStr} kW`, { bold: true }),
    ],
  });

  const mbaLead = new Paragraph({
    spacing: { after: 140, ...LINE_BODY },
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: INDENT_BLOCK },
    children: [
      tr("- Tính toán, lựa chọn công suất của máy biến áp theo công thức:", { bold: true }),
    ],
  });

  const mbaFormula = new Paragraph({
    spacing: { after: 160, before: 40, ...LINE_BODY },
    indent: { left: INDENT_BLOCK },
    children: [...sub("S", "MBA"), tr(" ≥ "), ...sub("P", "tt"), tr("/cosφ")],
  });

  const mbaTrongDo = new Paragraph({
    spacing: { after: 80, ...LINE_BODY },
    indent: { left: INDENT_BLOCK },
    children: [tr("Trong đó:", { bold: true })],
  });

  const mbaCos = new Paragraph({
    spacing: { after: 200, ...LINE_BODY },
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: INDENT_SUB },
    children: [
      tr(
        "cosφ: là hệ số công suất trung bình của lưới điện PCCC. Nếu không có số liệu chính xác, có thể lấy giá trị dự kiến trong khoảng 0,8 đến 0,85 do phụ tải chủ yếu là động cơ.",
      ),
    ],
  });

  const mbaKetLuan = new Paragraph({
    spacing: { after: 360, ...LINE_BODY },
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: INDENT_BLOCK },
    children: [
      tr(
        "- Kết luận: Để đảm bảo yêu cầu theo quy định, công trình phải sử dụng máy biến áp có công suất tối thiểu là ",
      ),
      tr(`${smbaStr} kVA`, { bold: true }),
      tr(` (tương đương `),
      ...sub("P", "tt"),
      tr(`/cosφ với `),
      ...sub("P", "tt"),
      tr(` = ${pttStr} kW, cosφ = ${cosStr}).`),
    ],
  });

  const h23 = new Paragraph({
    spacing: { before: 240, after: 200, ...LINE_BODY },
    outlineLevel: 1,
    children: [
      tr(
        "1.3. Tính toán, lựa chọn máy phát điện dự phòng khi công trình sử dụng bơm chữa cháy dự phòng là bơm điện",
        { bold: true, size: SZ_H2, font: FONT },
      ),
    ],
  });

  const h23a = new Paragraph({
    spacing: { after: 180, ...LINE_BODY },
    keepNext: true,
    outlineLevel: 2,
    children: [
      tr("a) Thông số của máy bơm chữa cháy điện dự phòng", {
        bold: true,
        size: SZ_BODY,
        font: FONT,
      }),
    ],
  });

  const tblBackup = buildLoadsTable(inputs.backupPumps);

  const genLead = new Paragraph({
    spacing: { before: 120, after: 140, ...LINE_BODY },
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: INDENT_BLOCK },
    children: [tr("- Tính toán công suất tính toán:", { bold: true })],
  });

  const formulaPttBackup = new Paragraph({
    spacing: { after: 180, before: 40, ...LINE_BODY },
    indent: { left: INDENT_BLOCK },
    children: [omathPttEqualsKycSumPi()],
  });

  const genTrongDo1 = new Paragraph({
    spacing: { after: 80, ...LINE_BODY },
    indent: { left: INDENT_BLOCK },
    children: [tr("Trong đó:", { bold: true })],
  });

  const nBackupExpl = new Paragraph({
    spacing: { after: 80, ...LINE_BODY },
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: INDENT_SUB },
    children: [tr("n - Số bơm chữa cháy dự phòng;")],
  });

  const piBackupExpl = new Paragraph({
    spacing: { after: 140, ...LINE_BODY },
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: INDENT_SUB },
    children: [
      ...sub("P", "i"),
      tr(
        " - Công suất điện định mức (kW) của động cơ bơm chữa cháy dự phòng thứ i.",
      ),
    ],
  });

  const pCalcPttB = new Paragraph({
    spacing: { after: 240, ...LINE_BODY },
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: INDENT_BLOCK },
    children: [
      tr("→ "),
      ...sub("P", "tt"),
      tr(` = ${kycStr} × ${sumBackupKwStr} = `),
      tr(`${pttBackupStr} kW`, { bold: true }),
    ],
  });

  const pkdLead = new Paragraph({
    spacing: { after: 140, ...LINE_BODY },
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: INDENT_BLOCK },
    children: [tr("- Tính toán công suất khởi động:", { bold: true })],
  });

  const formulaPkd = new Paragraph({
    spacing: { after: 180, before: 40, ...LINE_BODY },
    indent: { left: INDENT_BLOCK },
    children: [omathPkdEqualsKkdSumPi()],
  });

  const pkdTrongDo = new Paragraph({
    spacing: { after: 80, ...LINE_BODY },
    indent: { left: INDENT_BLOCK },
    children: [tr("Trong đó:", { bold: true })],
  });

  const pkdKkd = new Paragraph({
    spacing: { after: 200, ...LINE_BODY },
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: INDENT_SUB },
    children: [
      ...sub("K", "kđ"),
      tr(
        ": hệ số khởi động, lựa chọn theo catalog của nhà sản xuất hoặc theo phương pháp khởi động.",
      ),
    ],
  });

  const pCalcPkd = new Paragraph({
    spacing: { after: 280, ...LINE_BODY },
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: INDENT_BLOCK },
    children: [
      tr("→ "),
      ...sub("P", "kđ"),
      tr(` = `),
      ...sub("K", "kđ"),
      tr(` · ∑`),
      ...sub("P", "i"),
      tr(` = ${kkDStr} × ${sumBackupKwStr} = `),
      tr(`${pkdStr} kW`, { bold: true }),
    ],
  });

  const smpLead = new Paragraph({
    spacing: { after: 140, ...LINE_BODY },
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: INDENT_BLOCK },
    children: [
      tr("- Tính toán, lựa chọn công suất của máy phát điện dự phòng:", { bold: true }),
    ],
  });

  const smpForm1 = new Paragraph({
    spacing: { after: 100, ...LINE_BODY },
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: INDENT_BLOCK },
    children: [
      tr(
        "Công suất định mức của máy phát điện (SMPĐ) phải lớn hơn hoặc bằng giá trị lớn nhất giữa công suất vận hành và công suất yêu cầu khi khởi động, đồng thời có một hệ số dự phòng:",
      ),
    ],
  });

  const smpForm2 = new Paragraph({
    spacing: { after: 100, ...LINE_BODY },
    indent: { left: INDENT_BLOCK },
    children: [
      tr("SMPĐ", { italics: true }),
      tr(" ≥ max("),
      ...sub("S", "tt"),
      tr(", "),
      ...sub("S", "kđ"),
      tr(") · "),
      ...sub("k", "dp"),
    ],
  });

  const smpForm3 = new Paragraph({
    spacing: { after: 140, ...LINE_BODY },
    indent: { left: INDENT_BLOCK },
    children: [
      tr("↔ SMPĐ", { italics: true }),
      tr(" ≥ max("),
      ...sub("P", "tt"),
      tr("/cosφ, "),
      ...sub("P", "kđ"),
      tr("/cosφ) · "),
      ...sub("k", "dp"),
    ],
  });

  const smpTrongDo = new Paragraph({
    spacing: { after: 80, ...LINE_BODY },
    indent: { left: INDENT_BLOCK },
    children: [tr("Trong đó:", { bold: true })],
  });

  const smpKdp = new Paragraph({
    spacing: { after: 100, ...LINE_BODY },
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: INDENT_SUB },
    children: [
      ...sub("k", "dp"),
      tr(
        ": Hệ số dự phòng, thường lấy từ 1,1 đến 1,25 để đảm bảo máy hoạt động bền bỉ và có khả năng mở rộng tải trong tương lai.",
      ),
    ],
  });

  const smpCos = new Paragraph({
    spacing: { after: 200, ...LINE_BODY },
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: INDENT_SUB },
    children: [
      tr(
        "cosφ: là hệ số công suất trung bình của lưới điện PCCC. Nếu không có số liệu chính xác, có thể lấy giá trị dự kiến trong khoảng 0,8 đến 0,85 do phụ tải chủ yếu là động cơ.",
      ),
    ],
  });

  const smpNumeric = new Paragraph({
    spacing: { after: 240, ...LINE_BODY },
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: INDENT_BLOCK },
    children: [
      tr("→ max("),
      ...sub("S", "tt"),
      tr(", "),
      ...sub("S", "kđ"),
      tr(`) · `),
      ...sub("k", "dp"),
      tr(` = max(${sttStr}, ${skdStr}) × ${kdpStr} = `),
      tr(`${smpdStr} kVA`, { bold: true }),
      tr(` (với `),
      ...sub("S", "tt"),
      tr(` = ${sttStr} kVA, `),
      ...sub("S", "kđ"),
      tr(` = ${skdStr} kVA).`),
    ],
  });

  const smpKetLuan = new Paragraph({
    spacing: { after: 200, ...LINE_BODY },
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: INDENT_BLOCK },
    children: [
      tr(
        "Kết luận: Để đảm bảo theo quy định, máy phát điện dự phòng phải có công suất tối thiểu ",
      ),
      tr(`${smpdStr} kVA`, { bold: true }),
      tr(` (max(`),
      ...sub("P", "tt"),
      tr("/cosφ, "),
      ...sub("P", "kđ"),
      tr(`/cosφ) · `),
      ...sub("k", "dp"),
      tr(
        ` = max(${pttBackupStr}/${cosStr}, ${pkdStr}/${cosStr}) × ${kdpStr} kVA.`,
      ),
    ],
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: PAGE_MARGIN.top,
              right: PAGE_MARGIN.right,
              bottom: PAGE_MARGIN.bottom,
              left: PAGE_MARGIN.left,
            },
          },
        },
        children: [
          title,
          ...metaBlock,
          h11,
          h21,
          tblMain,
          h22,
          p22Lead,
          formulaPB,
          trongDo,
          kycExplanationParagraph(kycStr),
          nExpl,
          piExpl,
          pCalcPB,
          mbaLead,
          mbaFormula,
          mbaTrongDo,
          mbaCos,
          mbaKetLuan,
          h23,
          h23a,
          tblBackup,
          genLead,
          formulaPttBackup,
          genTrongDo1,
          kycExplanationParagraph(kycStr),
          nBackupExpl,
          piBackupExpl,
          pCalcPttB,
          pkdLead,
          formulaPkd,
          pkdTrongDo,
          pkdKkd,
          pCalcPkd,
          smpLead,
          smpForm1,
          smpForm2,
          smpForm3,
          smpTrongDo,
          smpKdp,
          smpCos,
          smpNumeric,
          smpKetLuan,
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
