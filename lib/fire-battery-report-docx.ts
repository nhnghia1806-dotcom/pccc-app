import type { ProjectMeta } from "@/domain/app-saved";
import type {
  FireBatteryInputs,
  FireBatteryResults,
  FireBatteryRowResult,
} from "@/domain/fire-battery/models";
import { formatCalcNumber } from "@/domain/pccc-electric/format-calc-number";

/** Số trong báo cáo tiếng Việt: dấu phẩy thập phân (0,5), khớp công thức 1,25 × … */
function formatVi(n: number): string {
  return formatCalcNumber(n).replace(/\./g, ",");
}
import {
  AlignmentType,
  BorderStyle,
  Document,
  LineRuleType,
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
const SZ_BODY = 26;
const SZ_TITLE = 36;
const SZ_H1 = 30;
const SZ_H2 = 28;

const PAGE_MARGIN = {
  top: convertInchesToTwip(2.5 / 2.54),
  right: convertInchesToTwip(2 / 2.54),
  bottom: convertInchesToTwip(2.5 / 2.54),
  left: convertInchesToTwip(3 / 2.54),
};

const INDENT_BLOCK = convertInchesToTwip(1 / 2.54);
const INDENT_SUB = convertInchesToTwip(1.5 / 2.54);

const LINE_BODY = {
  line: 276,
  lineRule: LineRuleType.AUTO,
} as const;

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

const tr = (text: string, opts?: IRunOptions) =>
  new TextRun({ text, font: FONT, size: SZ_BODY, ...opts });

function sub(base: string, subText: string, italics = true, bold = false) {
  return [
    new TextRun({ text: base, font: FONT, size: SZ_BODY, italics, bold }),
    new TextRun({
      text: subText,
      font: FONT,
      size: SZ_BODY,
      subScript: true,
      italics,
      bold,
    }),
  ];
}

function deviceCell(
  text: string,
  opts?: {
    bold?: boolean;
    header?: boolean;
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    colSpan?: number;
  },
): TableCell {
  const isHeader = opts?.header === true;
  const colSpan = opts?.colSpan;
  const align =
    opts?.align ?? (isHeader ? AlignmentType.CENTER : AlignmentType.LEFT);
  return new TableCell({
    ...(colSpan != null ? { columnSpan: colSpan } : {}),
    shading: isHeader ? { type: ShadingType.CLEAR, fill: "E8E8E8" } : undefined,
    children: [
      new Paragraph({
        alignment: align,
        spacing: { after: 0, before: 0, ...LINE_BODY },
        children: [tr(text, { bold: opts?.bold || isHeader })],
      }),
    ],
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
  });
}

function buildDeviceTable(
  titleTotalLabel: string,
  statusLabel: string,
  rows: FireBatteryRowResult[],
): Table {
  const header = new TableRow({
    tableHeader: true,
    children: [
      deviceCell("Thiết bị", { header: true }),
      deviceCell("Số lượng (cái)", { header: true }),
      deviceCell("Dòng tiêu thụ mỗi thiết bị (mA)", { header: true }),
      deviceCell("Dòng tiêu thụ (mA)", { header: true }),
      deviceCell("Trạng thái", { header: true }),
    ],
  });

  const body: TableRow[] = [header];

  if (rows.length === 0) {
    body.push(
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 5,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { ...LINE_BODY, after: 80 },
                children: [tr("Chưa có thiết bị.", { italics: true })],
              }),
            ],
            margins: { top: 80, bottom: 80, left: 100, right: 100 },
          }),
        ],
      }),
    );
  } else {
    for (const r of rows) {
      const name = r.name.trim() || "—";
      const q = Number.isFinite(r.quantity) ? Math.max(0, r.quantity) : 0;
      const m = Number.isFinite(r.mAEach) ? Math.max(0, r.mAEach) : 0;
      const line = Number.isFinite(r.totalMA) ? r.totalMA : q * m;
      body.push(
        new TableRow({
          children: [
            deviceCell(name, {}),
            deviceCell(String(q), { align: AlignmentType.CENTER }),
            deviceCell(formatVi(m), { align: AlignmentType.RIGHT }),
            deviceCell(formatVi(line), { align: AlignmentType.RIGHT }),
            deviceCell(statusLabel, {}),
          ],
        }),
      );
    }
  }

  if (rows.length > 0) {
    const sumMa = rows.reduce(
      (a, r) => a + (Number.isFinite(r.totalMA) ? r.totalMA : 0),
      0,
    );
    body.push(
      new TableRow({
        children: [
          deviceCell(titleTotalLabel, { bold: true, colSpan: 4 }),
          deviceCell(formatVi(sumMa), {
            bold: true,
            align: AlignmentType.RIGHT,
          }),
        ],
      }),
    );
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [2800, 1100, 2200, 1800, 1500],
    rows: body,
    borders: TABLE_BORDERS,
  });
}

export async function buildFireBatteryReportDocBuffer(
  pm: ProjectMeta,
  inputs: FireBatteryInputs,
  results: FireBatteryResults,
): Promise<Buffer> {
  const iqStr = formatVi(results.iqA);
  const iaStr = formatVi(results.iaA);
  const c20Str = formatVi(results.c20RequiredAh);
  const icStr = formatVi(results.icA);
  const ipseStr = formatVi(results.ipseA);
  const tqStr = formatVi(inputs.tqHours);
  const taStr = formatVi(inputs.taHours);
  const fcStr = formatVi(inputs.fc);

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
      children: [tr("Địa điểm: ", { bold: true }), tr(pm.diaDiem.trim() || "")],
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

  const title1 = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 80, line: 320, lineRule: LineRuleType.AUTO },
    children: [
      tr("KẾT QUẢ TÍNH TOÁN, LỰA CHỌN", {
        bold: true,
        size: SZ_TITLE,
        font: FONT,
      }),
    ],
  });

  const title2 = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 400, line: 320, lineRule: LineRuleType.AUTO },
    children: [
      tr("LỰA CHỌN NGUỒN CẤP ĐIỆN CHO HỆ THỐNG BÁO CHÁY TỰ ĐỘNG", {
        bold: true,
        size: SZ_TITLE,
        font: FONT,
      }),
    ],
  });

  const hI = new Paragraph({
    spacing: { before: 200, after: 200, ...LINE_BODY },
    outlineLevel: 0,
    children: [
      tr(
        "I. TÍNH TOÁN, LỰA CHỌN NGUỒN CẤP ĐIỆN CHO HỆ THỐNG BÁO CHÁY TỰ ĐỘNG",
        {
          bold: true,
          size: SZ_H1,
          font: FONT,
        },
      ),
    ],
  });

  const h11 = new Paragraph({
    spacing: { before: 160, after: 160, ...LINE_BODY },
    keepNext: true,
    outlineLevel: 1,
    children: [
      tr("1.1. Tính toán dung lượng ắc quy dự phòng", {
        bold: true,
        size: SZ_H2,
        font: FONT,
      }),
    ],
  });

  const pIqLead = new Paragraph({
    spacing: { after: 140, ...LINE_BODY },
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: INDENT_BLOCK },
    children: [
      tr(
        "- Tính toán dòng điện tổng ở trạng thái tĩnh ",
      ),
      ...sub("I", "Q", false),
      tr(
        " của tất cả các thiết bị khi hệ thống hoạt động ở chế độ bình thường",
      ),
    ],
  });

  const capStatic = new Paragraph({
    spacing: { before: 80, after: 120, ...LINE_BODY },
    alignment: AlignmentType.CENTER,
    children: [tr("THIẾT BỊ SỬ DỤNG", { bold: true })],
  });

  const tblStatic = buildDeviceTable(
    "Tổng dòng điện tiêu thụ",
    "Tĩnh",
    results.staticRows,
  );

  const pIqResult = new Paragraph({
    spacing: { before: 200, after: 240, ...LINE_BODY },
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: INDENT_BLOCK },
    children: [
      tr("Dòng điện tổng ở trạng thái tĩnh ", { bold: true }),
      ...sub("I", "Q", false, true),
      tr(" = ", { bold: true }),
      tr(`${iqStr} A`, { bold: true }),
      tr("."),
    ],
  });

  const pIaLead = new Paragraph({
    spacing: { after: 140, ...LINE_BODY },
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: INDENT_BLOCK },
    children: [
      tr("- Tính toán dòng điện tổng ở trạng thái báo cháy "),
      ...sub("I", "A", false),
      tr(
        ". Giả định khi báo cháy, tất cả các thiết bị của hệ thống đều hoạt động",
      ),
    ],
  });

  const capAlarm = new Paragraph({
    spacing: { before: 80, after: 120, ...LINE_BODY },
    alignment: AlignmentType.CENTER,
    children: [tr("THIẾT BỊ SỬ DỤNG", { bold: true })],
  });

  const tblAlarm = buildDeviceTable(
    "Dòng điện tổng ở trạng thái báo cháy)",
    "Báo cháy",
    results.alarmRows,
  );

  const pIaResult = new Paragraph({
    spacing: { before: 200, after: 240, ...LINE_BODY },
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: INDENT_BLOCK },
    children: [
      tr("Dòng điện tổng ở trạng thái báo cháy ", { bold: true }),
      ...sub("I", "A", false, true),
      tr(" = ", { bold: true }),
      tr(`${iaStr} A`, { bold: true }),
      tr("."),
    ],
  });

  const pC20Intro = new Paragraph({
    spacing: { after: 160, ...LINE_BODY },
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: INDENT_BLOCK },
    children: [
      tr(
        "- Tính dung lượng của ắc quy dự phòng với thời gian ở tải trọng tĩnh là ",
      ),
      tr(`${tqStr} giờ`, { bold: true }),
      tr(", thời gian ở phụ tải toàn tải (trạng thái báo cháy) là "),
      tr(`${taStr} h`, { bold: true }),
      tr(", có mức phóng điện 20 h, C20 ở 15 °C đến 30 °C (Ah)"),
    ],
  });

  const c20Formula = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 160, before: 40, ...LINE_BODY },
    children: [
      ...sub("C", "20"),
      tr(" = 1,25 × [( "),
      ...sub("I", "Q"),
      tr(" × "),
      ...sub("T", "Q"),
      tr(" ) + "),
      ...sub("F", "C"),
      tr(" × ( "),
      ...sub("I", "A"),
      tr(" × "),
      ...sub("T", "A"),
      tr(" )]"),
    ],
  });

  const trongDoC20 = new Paragraph({
    spacing: { after: 80, ...LINE_BODY },
    indent: { left: INDENT_BLOCK },
    children: [tr("Trong đó:", { bold: true })],
  });

  const c20Items: Paragraph[] = [
    new Paragraph({
      spacing: { after: 80, ...LINE_BODY },
      alignment: AlignmentType.JUSTIFIED,
      indent: { left: INDENT_SUB },
      children: [tr("1,25: Là hệ số gây hư hỏng ắc quy;")],
    }),
    new Paragraph({
      spacing: { after: 80, ...LINE_BODY },
      alignment: AlignmentType.JUSTIFIED,
      indent: { left: INDENT_SUB },
      children: [
        ...sub("I", "Q", false),
        tr(": Là dòng điện tổng ở tải trọng tĩnh;"),
      ],
    }),
    new Paragraph({
      spacing: { after: 80, ...LINE_BODY },
      alignment: AlignmentType.JUSTIFIED,
      indent: { left: INDENT_SUB },
      children: [
        ...sub("T", "Q", false),
        tr(
          ": Là thời gian của nguồn điện dự phòng ở tải trọng tĩnh (thường là 24 h);",
        ),
      ],
    }),
    new Paragraph({
      spacing: { after: 80, ...LINE_BODY },
      alignment: AlignmentType.JUSTIFIED,
      indent: { left: INDENT_SUB },
      children: [
        ...sub("F", "C", false),
        tr(": Là hệ số giảm dung lượng của ắc quy ở I_A;"),
      ],
    }),
    new Paragraph({
      spacing: { after: 80, ...LINE_BODY },
      alignment: AlignmentType.JUSTIFIED,
      indent: { left: INDENT_SUB },
      children: [
        ...sub("I", "A", false),
        tr(": Là dòng điện tổng ở điều kiện báo cháy;"),
      ],
    }),
    new Paragraph({
      spacing: { after: 140, ...LINE_BODY },
      alignment: AlignmentType.JUSTIFIED,
      indent: { left: INDENT_SUB },
      children: [
        ...sub("T", "A", false),
        tr(
          ": Là thời gian của nguồn điện dự phòng ở phụ tải toàn tải (thường là 0,5 h).",
        ),
      ],
    }),
  ];

  /** Sau “Trong đó:” — thay số và kết quả, giống tab trạm bơm (→ … = …). */
  const pCalcC20 = new Paragraph({
    spacing: { after: 240, ...LINE_BODY },
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: INDENT_BLOCK },
    children: [
      tr("→ "),
      ...sub("C", "20", false),
      tr(" = 1,25 × [("),
      ...sub("I", "Q", false),
      tr(" × "),
      ...sub("T", "Q", false),
      tr(") + "),
      ...sub("F", "C", false),
      tr(" × ("),
      ...sub("I", "A", false),
      tr(" × "),
      ...sub("T", "A", false),
      tr(")] = 1,25 × [("),
      tr(`${iqStr} × ${tqStr}`),
      tr(") + "),
      tr(fcStr),
      tr(" × ("),
      tr(`${iaStr} × ${taStr}`),
      tr(")] = "),
      tr(`${c20Str} Ah`, { bold: true }),
      tr("."),
    ],
  });

  const h12 = new Paragraph({
    spacing: { before: 200, after: 160, ...LINE_BODY },
    outlineLevel: 2,
    children: [
      tr("1.2. Tính toán dòng điện nạp nhỏ nhất cho ắc quy:", {
        bold: true,
        size: SZ_H2,
        font: FONT,
      }),
    ],
  });

  const icFormula = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 160, before: 40, ...LINE_BODY },
    children: [
      ...sub("I", "C"),
      tr(" = 1,25 × [( "),
      ...sub("I", "Q"),
      tr(" × 5) + ("),
      ...sub("I", "A"),
      tr(" × 0,5)] / 24"),
    ],
  });

  const trongDoIc = new Paragraph({
    spacing: { after: 80, ...LINE_BODY },
    indent: { left: INDENT_BLOCK },
    children: [tr("Trong đó:", { bold: true })],
  });

  const icItems: Paragraph[] = [
    new Paragraph({
      spacing: { after: 80, ...LINE_BODY },
      alignment: AlignmentType.JUSTIFIED,
      indent: { left: INDENT_SUB },
      children: [
        tr("1,25: là hệ số nâng thêm để tránh tổn thất trong quá trình nạp;"),
      ],
    }),
    new Paragraph({
      spacing: { after: 80, ...LINE_BODY },
      alignment: AlignmentType.JUSTIFIED,
      indent: { left: INDENT_SUB },
      children: [
        ...sub("I", "Q", false),
        tr(": là dòng điện tổng ở tải trọng tĩnh;"),
      ],
    }),
    new Paragraph({
      spacing: { after: 80, ...LINE_BODY },
      alignment: AlignmentType.JUSTIFIED,
      indent: { left: INDENT_SUB },
      children: [
        ...sub("I", "A", false),
        tr(": là dòng điện tổng ở điều kiện báo cháy;"),
      ],
    }),
    new Paragraph({
      spacing: { after: 140, ...LINE_BODY },
      alignment: AlignmentType.JUSTIFIED,
      indent: { left: INDENT_SUB },
      children: [
        tr(
          "Dòng điện nạp của ắc quy nên nạp lại cho ắc quy đã phóng điện trong 24 h để có đủ dung lượng duy trì hệ thống báo cháy trong 5 h với tải trọng tĩnh bình thường, theo sau là 30 phút ở điều kiện báo cháy.",
        ),
      ],
    }),
  ];

  const pCalcIc = new Paragraph({
    spacing: { after: 280, ...LINE_BODY },
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: INDENT_BLOCK },
    children: [
      tr("→ "),
      ...sub("I", "C", false),
      tr(" = 1,25 × [("),
      ...sub("I", "Q", false),
      tr(" × 5) + ("),
      ...sub("I", "A", false),
      tr(" × 0,5)] / 24 = 1,25 × [("),
      tr(`${iqStr} × 5) + (${iaStr} × 0,5)] / 24 = `),
      tr(`${icStr} A`, { bold: true }),
      tr("."),
    ],
  });

  const h13 = new Paragraph({
    spacing: { before: 200, after: 160, ...LINE_BODY },
    outlineLevel: 2,
    children: [
      tr("1.3. Tính toán dòng điện của nguồn chính, IPSE:", {
        bold: true,
        size: SZ_H2,
        font: FONT,
      }),
    ],
  });

  const ipseFormula = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 160, before: 40, ...LINE_BODY },
    children: [
      ...sub("I", "PSE"),
      tr(" = "),
      ...sub("I", "Q"),
      tr(" + "),
      ...sub("I", "C"),
    ],
  });

  const trongDoIpe = new Paragraph({
    spacing: { after: 80, ...LINE_BODY },
    indent: { left: INDENT_BLOCK },
    children: [tr("Trong đó:", { bold: true })],
  });

  const ipeItems: Paragraph[] = [
    new Paragraph({
      spacing: { after: 80, ...LINE_BODY },
      alignment: AlignmentType.JUSTIFIED,
      indent: { left: INDENT_SUB },
      children: [...sub("I", "C", false), tr(" là dòng điện nạp;")],
    }),
    new Paragraph({
      spacing: { after: 140, ...LINE_BODY },
      alignment: AlignmentType.JUSTIFIED,
      indent: { left: INDENT_SUB },
      children: [
        ...sub("I", "Q", false),
        tr(" là dòng điện tổng ở tải trọng tĩnh;"),
      ],
    }),
  ];

  const pCalcIpe = new Paragraph({
    spacing: { after: 360, ...LINE_BODY },
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: INDENT_BLOCK },
    children: [
      tr("→ "),
      ...sub("I", "PSE", false),
      tr(" = "),
      ...sub("I", "Q", false),
      tr(" + "),
      ...sub("I", "C", false),
      tr(` = ${iqStr} + ${icStr} = `),
      tr(`${ipseStr} A`, { bold: true }),
      tr("."),
    ],
  });

  const h14 = new Paragraph({
    spacing: { before: 200, after: 160, ...LINE_BODY },
    outlineLevel: 2,
    children: [tr("1.4. Kết luận:", { bold: true, size: SZ_H2, font: FONT })],
  });

  const ketLuanIntro = new Paragraph({
    spacing: { after: 120, ...LINE_BODY },
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: INDENT_BLOCK },
    children: [
      tr(
        "Như vậy, theo kết quả tính toán, lựa chọn nguồn điện cho hệ thống báo cháy như sau:",
      ),
    ],
  });

  const ketLuan1 = new Paragraph({
    spacing: { after: 100, ...LINE_BODY },
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: INDENT_SUB },
    children: [
      tr("+ Ắc quy dự phòng có dung lượng thấp nhất theo tính toán là "),
      ...sub("C", "20", false),
      tr(` = ${c20Str} Ah`, { bold: true }),
      tr("."),
    ],
  });

  const ketLuan2 = new Paragraph({
    spacing: { after: 120, ...LINE_BODY },
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: INDENT_SUB },
    children: [
      tr("+ Bộ cấp nguồn chính: Dòng điện nguồn chính theo tính toán là "),
      ...sub("I", "PSE", false),
      tr(` = ${ipseStr} A`, { bold: true }),
      tr(", dòng điện ở điều kiện báo cháy là "),
      ...sub("I", "A", false),
      tr(` = ${iaStr} A`, { bold: true }),
      tr(", dòng điện nạp tối thiểu cho ắc quy là "),
      ...sub("I", "C", false),
      tr(` = ${icStr} A`, { bold: true }),
      tr("."),
    ],
  });

  const giaTriThamSo = new Paragraph({
    spacing: { before: 200, after: 80, ...LINE_BODY },
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: INDENT_BLOCK },
    children: [
      tr("(Tham số dùng trong tính toán: ", { italics: true }),
      ...sub("T", "Q"),
      tr(" = ", { italics: true }),
      tr(`${tqStr} h`, { italics: true }),
      tr(", ", { italics: true }),
      ...sub("T", "A"),
      tr(" = ", { italics: true }),
      tr(`${taStr} h`, { italics: true }),
      tr(", ", { italics: true }),
      ...sub("F", "C"),
      tr(" = ", { italics: true }),
      tr(fcStr, { italics: true }),
      tr(".)", { italics: true }),
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
          title1,
          title2,
          ...metaBlock,
          hI,
          h11,
          pIqLead,
          capStatic,
          tblStatic,
          pIqResult,
          pIaLead,
          capAlarm,
          tblAlarm,
          pIaResult,
          pC20Intro,
          c20Formula,
          trongDoC20,
          ...c20Items,
          pCalcC20,
          h12,
          icFormula,
          trongDoIc,
          ...icItems,
          pCalcIc,
          h13,
          ipseFormula,
          trongDoIpe,
          ...ipeItems,
          pCalcIpe,
          h14,
          ketLuanIntro,
          ketLuan1,
          ketLuan2,
          giaTriThamSo,
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
