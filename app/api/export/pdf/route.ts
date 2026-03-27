import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { chromium } from "playwright";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Inputs } from "@/domain/pccc-electric/models";
import { calcPcccElectric } from "@/domain/pccc-electric/calc";

function renderHtml(inputs: Inputs) {
  const r = calcPcccElectric(inputs);

  const rowLoads = (items: { name: string; kw: number; quantity: number }[]) =>
    items
      .map(
        (x, i) => `
        <tr>
          <td class="c">${i + 1}</td>
          <td>${escapeHtml(x.name)}</td>
          <td class="r">${num(x.kw)}</td>
          <td class="r">${num(x.quantity)}</td>
        </tr>`,
      )
      .join("");

  return `<!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <style>
      :root { --fg:#111; --muted:#666; --border:#e5e7eb; --bg:#fff; --soft:#f8fafc; }
      * { box-sizing: border-box; }
      body { margin: 24px; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; color: var(--fg); }
      h1 { margin: 0 0 8px; font-size: 18px; letter-spacing: .2px; }
      .sub { color: var(--muted); font-size: 12px; margin-bottom: 16px; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      .card { border: 1px solid var(--border); border-radius: 14px; overflow: hidden; }
      .card .hd { background: var(--soft); padding: 10px 12px; font-weight: 600; font-size: 12px; }
      .card .bd { padding: 12px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border-top: 1px solid var(--border); padding: 8px; vertical-align: top; }
      thead th { border-top: 0; color: var(--muted); font-weight: 600; background: #fff; }
      .c { text-align: center; width: 40px; }
      .r { text-align: right; white-space: nowrap; }
      .kpi { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      .k { border: 1px solid var(--border); border-radius: 12px; padding: 10px; }
      .k .t { font-size: 11px; color: var(--muted); }
      .k .v { font-size: 16px; font-weight: 700; margin-top: 4px; }
      .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
    </style>
  </head>
  <body>
    <h1>TÍNH TOÁN PHỤ TẢI ĐIỆN PCCC</h1>
    <div class="sub">Theo TCVN 9206:2012 (Kyc = 1; Kđt = 1)</div>

    <div class="grid">
      <div class="card">
        <div class="hd">Nhóm bơm chữa cháy chính (PB)</div>
        <div class="bd">
          <table>
            <thead><tr><th class="c">#</th><th>Tên</th><th class="r">Công suất định mức (KW)</th><th class="r">SL</th></tr></thead>
            <tbody>${rowLoads(inputs.pumpsMain)}</tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="hd">Nhóm thiết bị khác (PKHÁC)</div>
        <div class="bd">
          <table>
            <thead><tr><th class="c">#</th><th>Tên</th><th class="r">Công suất định mức (KW)</th><th class="r">SL</th></tr></thead>
            <tbody>${rowLoads(inputs.otherLoads)}</tbody>
          </table>
        </div>
      </div>
    </div>

    <div style="height: 12px"></div>

    <div class="grid">
      <div class="card">
        <div class="hd">Tham số</div>
        <div class="bd">
          <table>
            <tbody>
              <tr><td>Kđt</td><td class="r mono">${num(inputs.kdt)}</td></tr>
              <tr><td>Kyc</td><td class="r mono">${num(inputs.kyc)}</td></tr>
              <tr><td>cosφ</td><td class="r mono">${num(inputs.cosPhi)}</td></tr>
              <tr><td>kdp</td><td class="r mono">${num(inputs.kdp)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="hd">Kết quả</div>
        <div class="bd">
          <div class="kpi">
            <div class="k"><div class="t">PB</div><div class="v">${num(r.pb)} kW</div></div>
            <div class="k"><div class="t">PKHÁC</div><div class="v">${num(r.pkhac)} kW</div></div>
            <div class="k"><div class="t">Ptt</div><div class="v">${num(r.ptt)} kW</div></div>
            <div class="k"><div class="t">SMBA</div><div class="v">${num(r.smba)} kVA</div></div>
            <div class="k"><div class="t">Pkđ</div><div class="v">${num(r.pkd)} kW</div></div>
            <div class="k"><div class="t">SMPĐ</div><div class="v">${num(r.smpd)} kVA</div></div>
          </div>
        </div>
      </div>
    </div>
  </body>
  </html>`;
}

function num(x: number) {
  return Number.isFinite(x) ? x.toFixed(1) : "0.0";
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return c;
    }
  });
}

export async function POST() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const saved = await prisma.savedState.findUnique({ where: { userId: user.id } });
  const inputs = (saved?.json ?? null) as unknown as Inputs | null;
  if (!inputs) return NextResponse.json({ error: "no_state" }, { status: 400 });

  const html = renderHtml(inputs);

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "12mm", bottom: "12mm", left: "10mm", right: "10mm" },
    });
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": 'attachment; filename="pccc-dien.pdf"',
      },
    });
  } finally {
    await browser.close();
  }
}

