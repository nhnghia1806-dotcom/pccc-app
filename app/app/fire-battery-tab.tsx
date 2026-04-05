"use client";

import { useState } from "react";
import type {
  FireBatteryInputs,
  FireBatteryResults,
} from "@/domain/fire-battery/models";
import { KatexFormula } from "@/components/katex-formula";
import { formatCalcNumber } from "@/domain/pccc-electric/format-calc-number";

function NumberInput({
  value,
  onChange,
  step,
  min,
  variant = "alarm",
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  variant?: "neutral" | "alarm";
}) {
  const cls =
    variant === "alarm"
      ? "w-full rounded-lg border border-indigo-200/90 bg-white px-2 py-1.5 text-sm tabular-nums text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25"
      : "w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm tabular-nums outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20";
  return (
    <input
      className={cls}
      type="number"
      value={Number.isFinite(value) ? value : 0}
      min={min}
      step={step}
      onChange={(e) =>
        onChange(e.target.value === "" ? 0 : Number(e.target.value))
      }
    />
  );
}

function Card({
  title,
  children,
  icon,
  right,
  variant = "alarm",
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  icon?: string;
  right?: React.ReactNode;
  /** alarm: chủ đề báo cháy / TTBC (indigo–blue) */
  variant?: "neutral" | "alarm";
}) {
  const isAlarm = variant === "alarm";
  if (!isAlarm) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            {icon ? (
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs">
                {icon}
              </span>
            ) : null}
            <div className="text-[15px] font-bold tracking-tight text-slate-800">
              {title}
            </div>
          </div>
          {right}
        </div>
        <div className="p-4">{children}</div>
      </section>
    );
  }
  return (
    <section className="overflow-hidden rounded-2xl border border-indigo-200/70 bg-white shadow-md shadow-indigo-900/10 ring-1 ring-indigo-900/5">
      <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-indigo-800 via-blue-700 to-slate-800 px-4 py-3.5 text-white shadow-inner">
        <div className="flex min-w-0 items-center gap-2.5">
          {icon ? (
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 text-base shadow-sm backdrop-blur-sm">
              {icon}
            </span>
          ) : null}
          <div className="text-[15px] font-bold tracking-tight text-white drop-shadow-sm">
            {title}
          </div>
        </div>
        {right ? (
          <div className="[&_button]:rounded-lg [&_button]:border-white/35 [&_button]:bg-white/10 [&_button]:text-white [&_button]:hover:bg-white/20">
            {right}
          </div>
        ) : null}
      </div>
      <div className="bg-gradient-to-b from-indigo-50/35 to-white p-4 sm:p-5">
        {children}
      </div>
    </section>
  );
}

function EditableDeviceTable({
  title,
  statusLabel,
  rows,
  onRowsChange,
  addLabel,
}: {
  title: string;
  statusLabel: string;
  rows: FireBatteryInputs["staticRows"];
  onRowsChange: (rows: FireBatteryInputs["staticRows"]) => void;
  /** Dùng cho tên mặc định: "{addLabel} {n}" — giống tab Điện */
  addLabel: string;
}) {
  const lineTotals = rows.map((r) => {
    const q = Number.isFinite(r.quantity) ? Math.max(0, r.quantity) : 0;
    const m = Number.isFinite(r.mAEach) ? Math.max(0, r.mAEach) : 0;
    return q * m;
  });
  const totalMA = lineTotals.reduce((a, b) => a + b, 0);

  function updateRow(
    i: number,
    patch: Partial<FireBatteryInputs["staticRows"][number]>,
  ) {
    onRowsChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  return (
    <div className="space-y-3">
      <div className="text-sm font-bold uppercase tracking-wide text-indigo-950/90">
        {title}
      </div>
      <div className="overflow-x-auto rounded-xl border border-indigo-200/80 shadow-sm">
        <table className="w-full min-w-[720px] text-sm">
          <colgroup>
            <col className="w-[8%]" />
            <col className="w-[26%]" />
            <col className="w-[10%]" />
            <col className="w-[18%]" />
            <col className="w-[14%]" />
            <col className="w-[14%]" />
            <col className="w-11" />
          </colgroup>
          <thead className="bg-gradient-to-r from-indigo-900 to-blue-800 text-left text-[11px] font-semibold uppercase tracking-wide text-white">
            <tr>
              <th className="px-3 py-2.5">STT</th>
              <th className="px-3 py-2.5">Tên</th>
              <th className="px-3 py-2.5">Số lượng</th>
              <th className="px-3 py-2.5">
                <span className="inline-flex flex-wrap items-baseline gap-x-1">
                  Dòng tiêu thụ mỗi thiết bị <span>(mA)</span>
                </span>
              </th>
              <th className="px-3 py-2.5">Dòng tiêu thụ (mA)</th>
              <th className="px-3 py-2.5">Trạng thái</th>
              <th className="px-1 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-8 text-center text-sm text-indigo-900/50"
                >
                  Chưa có thiết bị.
                </td>
              </tr>
            ) : (
              rows.map((r, idx) => {
                const line = lineTotals[idx] ?? 0;
                return (
                  <tr
                    key={idx}
                    className="border-t border-indigo-100/80 transition hover:bg-violet-50/50"
                  >
                    <td className="px-4 py-2.5 text-left text-sm font-semibold tabular-nums text-indigo-950/80">
                      {idx + 1}
                    </td>
                    <td className="min-w-0 px-3 py-2">
                      <input
                        className="w-full rounded-lg border border-indigo-200/80 bg-white px-2 py-1.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                        value={r.name}
                        onChange={(e) =>
                          updateRow(idx, { name: e.target.value })
                        }
                        placeholder="Tên thiết bị"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <NumberInput
                        variant="alarm"
                        value={r.quantity}
                        min={0}
                        step={1}
                        onChange={(q) =>
                          updateRow(idx, {
                            quantity: Math.max(0, Math.round(q)),
                          })
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <NumberInput
                        variant="alarm"
                        value={r.mAEach}
                        min={0}
                        step={0.1}
                        onChange={(m) => updateRow(idx, { mAEach: m })}
                      />
                    </td>
                    <td className="px-3 py-2 font-sans tabular-nums font-medium text-indigo-950">
                      {formatCalcNumber(line)}
                    </td>
                    <td className="px-3 py-2 text-sm font-medium text-indigo-800/80">
                      {statusLabel}
                    </td>
                    <td className="px-1 py-2">
                      <button
                        type="button"
                        className="rounded-lg border border-indigo-200/80 bg-white px-2 py-1.5 text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-800"
                        title="Xóa"
                        onClick={() =>
                          onRowsChange(rows.filter((_, i) => i !== idx))
                        }
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
            {rows.length > 0 ? (
              <tr className="border-t-2 border-indigo-200/90 bg-gradient-to-r from-indigo-50/90 to-blue-50/50 font-semibold text-indigo-950">
                <td className="px-3 py-2.5" colSpan={4}>
                  Tổng dòng tiêu thụ (mA)
                </td>
                <td className="px-3 py-2.5 font-sans tabular-nums text-base">
                  {formatCalcNumber(totalMA)}
                </td>
                <td className="px-3 py-2.5" colSpan={2} />
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-xl border-2 border-cyan-400/70 bg-gradient-to-r from-cyan-400 to-sky-500 px-4 py-2.5 text-sm font-bold text-indigo-950 shadow-sm shadow-cyan-900/15 transition hover:brightness-105 active:scale-[0.99]"
        onClick={() =>
          onRowsChange([
            ...rows,
            { name: `${addLabel} ${rows.length + 1}`, quantity: 1, mAEach: 0 },
          ])
        }
      >
        + Thêm
      </button>
    </div>
  );
}

type Props = {
  inputs: FireBatteryInputs;
  onChange: (next: FireBatteryInputs) => void;
  results: FireBatteryResults;
  onCalculate: () => void;
  onReset: () => void;
  onExportWord?: () => void;
  calculateError: string | null;
};

export default function FireBatteryTab({
  inputs,
  onChange,
  results: r,
  onCalculate,
  onReset,
  onExportWord,
  calculateError,
}: Props) {
  const [formulaPanelOpen, setFormulaPanelOpen] = useState(true);

  return (
    <div className="space-y-6 font-sans">
      <Card
        title="Công thức tính toán"
        icon="📘"
        right={
          <button
            type="button"
            className="rounded-lg border border-white/35 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20"
            onClick={() => setFormulaPanelOpen((v) => !v)}
            aria-expanded={formulaPanelOpen}
          >
            {formulaPanelOpen ? "Đóng" : "Mở"}
          </button>
        }
      >
        {formulaPanelOpen ? (
          <div className="space-y-3 text-sm text-zinc-800">
            <div className="rounded-xl border border-indigo-200/70 bg-indigo-50/50 px-3 py-2">
              <div className="font-bold text-indigo-950">
                1) Dòng điện tổng trạng thái tĩnh{" "}
                <KatexFormula display={false} math="I_Q" className="!inline" />
              </div>
              <div className="mb-3 rounded-lg border border-indigo-300/60 bg-white p-3 text-indigo-900">
                <KatexFormula math="I_{Q} = \displaystyle\sum_{i=1}^{n} I_i" />
              </div>
              <ul className="space-y-1 text-sm text-slate-700">
                <li className="flex flex-wrap items-baseline gap-x-1.5">
                  <span className="text-indigo-600">•</span>
                  <KatexFormula
                    display={false}
                    math="I_i = I_{tt} \cdot \text{Số lượng}"
                  />
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-indigo-200/70 bg-indigo-50/50 px-3 py-2">
              <div className="font-bold text-indigo-950">
                2) Dòng điện tổng trạng thái báo cháy{" "}
                <KatexFormula display={false} math="I_A" className="!inline" />
              </div>
              <div className="mb-3 rounded-lg border border-indigo-300/60 bg-white p-3 text-indigo-900">
                <KatexFormula math="I_{A} = \displaystyle\sum_{i=1}^{n} I_i" />
              </div>
              <ul className="space-y-1 text-sm text-slate-700">
                <li className="flex flex-wrap items-baseline gap-x-1.5">
                  <span className="text-indigo-600">•</span>
                  <KatexFormula
                    display={false}
                    math="I_i = I_{tt} \cdot \text{Số lượng}"
                  />
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-indigo-200/70 bg-indigo-50/50 px-3 py-2">
              <div className="font-bold text-indigo-950">
                3) Dung lượng ắc quy{" "}
                <KatexFormula
                  display={false}
                  math="C_{20}"
                  className="!inline"
                />
              </div>
              <div className="mb-3 rounded-lg border border-indigo-300/60 bg-white p-3 text-indigo-900">
                <KatexFormula math="C_{20} = 1{,}25 \cdot \bigl[(I_Q \cdot T_Q) + F_C \cdot (I_A \cdot T_A)\bigr]" />
              </div>
              <ul className="space-y-1 text-sm text-slate-700">
                <li className="flex flex-wrap items-baseline gap-x-1.5">
                  <span className="text-indigo-600">•</span>
                  <KatexFormula display={false} math="1{,}25" />
                  <span>: Hệ số gây hư hỏng ắc quy</span>
                </li>
                <li className="flex flex-wrap items-baseline gap-x-1.5">
                  <span className="text-indigo-600">•</span>
                  <KatexFormula display={false} math="I_Q" />
                  <span>: Dòng điện tổng ở tải trọng tĩnh</span>
                </li>
                <li className="flex flex-wrap items-baseline gap-x-1.5">
                  <span className="text-indigo-600">•</span>
                  <KatexFormula display={false} math="T_Q" />
                  <span>
                    : Thời gian của nguồn điện dự phòng ở tải trọng tĩnh (thường
                    là 24 h)
                  </span>
                </li>
                <li className="flex flex-wrap items-baseline gap-x-1.5">
                  <span className="text-indigo-600">•</span>
                  <KatexFormula display={false} math="F_C" />
                  <span>
                    : Hệ số giảm dung lượng của ắc quy ở{" "}
                    <KatexFormula
                      display={false}
                      math="I_A"
                      className="!inline"
                    />
                  </span>
                </li>
                <li className="flex flex-wrap items-baseline gap-x-1.5">
                  <span className="text-indigo-600">•</span>
                  <KatexFormula display={false} math="I_A" />
                  <span>: Dòng điện tổng ở điều kiện báo cháy</span>
                </li>
                <li className="flex flex-wrap items-baseline gap-x-1.5">
                  <span className="text-indigo-600">•</span>
                  <KatexFormula display={false} math="T_A" />
                  <span>
                    : Thời gian của nguồn điện dự phòng ở phụ tải toàn tải
                    (thường là 0,5 h)
                  </span>
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-indigo-200/70 bg-indigo-50/50 px-3 py-2">
              <div className="font-bold text-indigo-950">
                4) Dòng điện nạp tối thiểu{" "}
                <KatexFormula display={false} math="I_C" className="!inline" />
              </div>
              <div className="mb-3 rounded-lg border border-indigo-300/60 bg-white p-3 text-indigo-900">
                <KatexFormula math="I_C = \dfrac{1{,}25 \cdot \bigl[(I_Q \cdot 5) + (I_A \cdot 0{,}5)\bigr]}{24}" />
              </div>
              <ul className="space-y-1 text-sm text-slate-700">
                <li className="flex flex-wrap items-baseline gap-x-1.5">
                  <span className="text-indigo-600">•</span>
                  <KatexFormula display={false} math="1{,}25" />
                  <span>
                    : Hệ số nâng thêm để tránh tổn thất trong quá trình nạp
                  </span>
                </li>
                <li className="flex flex-wrap items-baseline gap-x-1.5">
                  <span className="text-indigo-600">•</span>
                  <KatexFormula display={false} math="I_Q" />
                  <span>: Dòng điện tổng ở tải trọng tĩnh</span>
                </li>

                <li className="flex flex-wrap items-baseline gap-x-1.5">
                  <span className="text-indigo-600">•</span>
                  <KatexFormula display={false} math="I_A" />
                  <span>: Dòng điện tổng ở điều kiện báo cháy</span>
                </li>
                <li className="flex flex-wrap items-baseline gap-x-1.5">
                  <span className="text-indigo-600">•</span>
                  <KatexFormula display={false} math="24" />
                  <span>: Thời gian nạp lại (giờ) — nạp trong vòng 24h</span>
                </li>
                <li className="flex flex-wrap items-baseline gap-x-1.5">
                  <span className="text-indigo-600">•</span>
                  <span className="inline-flex flex-wrap items-baseline gap-x-1">
                    <KatexFormula display={false} math="5\ \text{h}" />
                    <span className="text-slate-600">&</span>
                    <KatexFormula display={false} math="0{,}5\ \text{h}" />
                  </span>
                  <span>
                    : Thời gian ắc quy duy trì hệ thống báo cháy với tải trọng
                    tĩnh bình thường và ở điều kiện báo cháy (30 phút)
                  </span>
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-indigo-200/70 bg-indigo-50/50 px-3 py-2">
              <div className="font-bold text-indigo-950">
                5) Dòng điện tổng nguồn chính{" "}
                <KatexFormula
                  display={false}
                  math="I_{\mathrm{PSE}}"
                  className="!inline"
                />
              </div>
              <div className="mb-3 rounded-lg border border-indigo-300/60 bg-white p-3 text-indigo-900">
                <KatexFormula math="I_{\mathrm{PSE}} = I_Q + I_C" />
              </div>
              <ul className="space-y-1 text-sm text-slate-700">
                <li className="flex flex-wrap items-baseline gap-x-1.5">
                  <span className="text-indigo-600">•</span>
                  <KatexFormula display={false} math="I_Q" />
                  <span>: Dòng điện tổng trạng thái tĩnh</span>
                </li>
                <li className="flex flex-wrap items-baseline gap-x-1.5">
                  <span className="text-indigo-600">•</span>
                  <KatexFormula display={false} math="I_C" />
                  <span>: Dòng điện nạp tối thiểu</span>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-600">
            Đang ẩn phần công thức. Bấm{" "}
            <span className="font-semibold text-indigo-800">Mở</span> ở góc phải
            để mở lại.
          </p>
        )}
      </Card>

      <div className="rounded-xl border border-indigo-200/60 bg-gradient-to-r from-indigo-50/80 to-cyan-50/40 px-4 py-3">
        <h2 className="text-balance text-base font-extrabold uppercase tracking-wide text-indigo-950 sm:text-lg">
          Tính toán dung lượng ắc quy dự phòng
        </h2>
      </div>

      <Card
        title={
          <span className="inline-flex flex-wrap items-center gap-x-1">
            Dòng điện tiêu thụ tĩnh (
            <KatexFormula display={false} math="I_Q" className="!inline" />)
          </span>
        }
        icon="🔋"
      >
        <EditableDeviceTable
          title="THIẾT BỊ SỬ DỤNG"
          statusLabel="Tĩnh"
          rows={inputs.staticRows}
          addLabel="Thiết bị"
          onRowsChange={(staticRows) => onChange({ ...inputs, staticRows })}
        />
      </Card>

      <Card
        title={
          <span className="inline-flex flex-wrap items-center gap-x-1">
            Dòng điện tiêu thụ khi báo cháy (
            <KatexFormula display={false} math="I_A" className="!inline" />)
          </span>
        }
        icon="🔔"
      >
        <EditableDeviceTable
          title="THIẾT BỊ SỬ DỤNG"
          statusLabel="Báo cháy"
          rows={inputs.alarmRows}
          addLabel="Thiết bị"
          onRowsChange={(alarmRows) => onChange({ ...inputs, alarmRows })}
        />
      </Card>

      <Card title="Tham số chung" icon="🔧">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block">
            <span className="inline-flex flex-wrap items-baseline gap-x-1 text-xs font-semibold text-indigo-900/85">
              <KatexFormula display={false} math="T_Q" className="!inline" />
              <span>(h) — Thời gian nguồn điện dự phòng tĩnh</span>
            </span>
            <NumberInput
              value={inputs.tqHours}
              min={0}
              step={0.5}
              onChange={(tqHours) => onChange({ ...inputs, tqHours })}
            />
          </label>
          <label className="block">
            <span className="inline-flex flex-wrap items-baseline gap-x-1 text-xs font-semibold text-indigo-900/85">
              <KatexFormula display={false} math="T_A" className="!inline" />
              <span>(h) — Thời gian nguồn điện dự phòng phụ tải</span>
            </span>
            <NumberInput
              value={inputs.taHours}
              min={0}
              step={0.1}
              onChange={(taHours) => onChange({ ...inputs, taHours })}
            />
          </label>
          <label className="block">
            <span className="inline-flex flex-wrap items-baseline gap-x-1 text-xs font-semibold text-indigo-900/85">
              <KatexFormula display={false} math="F_C" className="!inline" />
              <span>— Hệ số giảm dung lượng (</span>
              <KatexFormula display={false} math="I_A" className="!inline" />
              <span>)</span>
            </span>
            <NumberInput
              value={inputs.fc}
              min={0}
              step={0.01}
              onChange={(fc) => onChange({ ...inputs, fc })}
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-900/20 transition hover:brightness-105 active:scale-[0.99]"
            onClick={onCalculate}
          >
            ⚡ Tính toán
          </button>
          <button
            type="button"
            className="rounded-xl border-2 border-rose-300/90 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-800 shadow-sm transition hover:bg-rose-100 active:scale-[0.99]"
            onClick={onReset}
          >
            Reset
          </button>
          {onExportWord ? (
            <button
              type="button"
              className="rounded-xl border-2 border-indigo-200 bg-white px-4 py-2.5 text-sm font-bold text-indigo-900 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50/60 active:scale-[0.99]"
              onClick={onExportWord}
            >
              Xuất Word
            </button>
          ) : null}
        </div>
        {calculateError ? (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {calculateError}
          </div>
        ) : null}
      </Card>

      <Card title="Kết quả tính toán" icon="✅">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-indigo-200/80 bg-gradient-to-br from-white to-indigo-50/40 px-4 py-3 shadow-sm shadow-indigo-900/5">
            <div className="flex flex-wrap items-baseline gap-x-1 text-xs font-semibold text-indigo-800/75">
              <KatexFormula display={false} math="I_Q" className="!inline" />
              <span>— Dòng tĩnh (A)</span>
            </div>
            <div className="text-2xl font-bold tabular-nums tracking-tight text-indigo-950">
              {formatCalcNumber(r.iqA)}{" "}
              <span className="text-base font-semibold text-indigo-800">A</span>
            </div>
          </div>
          <div className="rounded-xl border border-indigo-200/80 bg-gradient-to-br from-white to-indigo-50/40 px-4 py-3 shadow-sm shadow-indigo-900/5">
            <div className="flex flex-wrap items-baseline gap-x-1 text-xs font-semibold text-indigo-800/75">
              <KatexFormula display={false} math="I_A" className="!inline" />
              <span>— Dòng báo cháy (A)</span>
            </div>
            <div className="text-2xl font-bold tabular-nums tracking-tight text-indigo-950">
              {formatCalcNumber(r.iaA)}{" "}
              <span className="text-base font-semibold text-indigo-800">A</span>
            </div>
          </div>
          <div className="rounded-xl border border-cyan-200/90 bg-gradient-to-br from-cyan-50/50 to-white px-4 py-3 shadow-sm shadow-cyan-900/10 ring-1 ring-cyan-200/40">
            <div className="flex flex-wrap items-baseline gap-x-1 text-xs font-semibold text-cyan-900/80">
              <KatexFormula display={false} math="C_{20}" className="!inline" />
              <span>— Dung lượng ác quy (Ah)</span>
            </div>
            <div className="text-2xl font-bold tabular-nums tracking-tight text-indigo-950">
              {formatCalcNumber(r.c20RequiredAh)}{" "}
              <span className="text-base font-semibold text-cyan-900">Ah</span>
            </div>
          </div>
          <div className="rounded-xl border border-indigo-200/80 bg-gradient-to-br from-white to-indigo-50/40 px-4 py-3 shadow-sm shadow-indigo-900/5">
            <div className="flex flex-wrap items-baseline gap-x-1 text-xs font-semibold text-indigo-800/75">
              <KatexFormula display={false} math="I_C" className="!inline" />
              <span>— Dòng nạp tối thiểu (A)</span>
            </div>
            <div className="text-2xl font-bold tabular-nums tracking-tight text-indigo-950">
              {formatCalcNumber(r.icA)}{" "}
              <span className="text-base font-semibold text-indigo-800">A</span>
            </div>
          </div>
          <div className="rounded-xl border border-indigo-200/80 bg-gradient-to-br from-white to-indigo-50/40 px-4 py-3 shadow-sm shadow-indigo-900/5">
            <div className="flex flex-wrap items-baseline gap-x-1 text-xs font-semibold text-indigo-800/75">
              <KatexFormula
                display={false}
                math="I_{\mathrm{PSE}}"
                className="!inline"
              />
              <span>— Dòng tổng nguồn (A)</span>
            </div>
            <div className="text-2xl font-bold tabular-nums tracking-tight text-indigo-950">
              {formatCalcNumber(r.ipseA)}{" "}
              <span className="text-base font-semibold text-indigo-800">A</span>
            </div>
          </div>
        </div>

        {r.c20RequiredAh === 0 ? (
          <div className="mt-3 rounded-xl border border-indigo-200/70 bg-indigo-50/50 px-3 py-2.5 text-sm text-indigo-900/85">
            Để tính dung lượng ác quy dự phòng, hãy thêm thiết bị.
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-indigo-200/80 bg-gradient-to-b from-white to-indigo-50/30 px-4 py-3 shadow-sm">
            <div className="text-sm font-extrabold uppercase tracking-wide text-indigo-950">
              Kết luận
            </div>
            <p className="mt-2 text-sm leading-relaxed text-indigo-950/90">
              Như vậy, theo kết quả tính toán, lựa chọn nguồn điện cho hệ thống
              báo cháy như sau:
            </p>
            <ul className="mt-3 list-none space-y-3 text-sm leading-relaxed text-indigo-950/90">
              <li className="flex flex-wrap items-baseline gap-x-1 pl-0">
                <span className="mr-1 font-bold text-cyan-700">+</span>
                <span>
                  Ắc quy dự phòng có dung lượng thấp nhất theo tính toán là{" "}
                </span>
                <KatexFormula
                  display={false}
                  math="C_{20}"
                  className="!inline"
                />
                <span className="tabular-nums font-bold text-indigo-950">
                  {" = "}
                  {formatCalcNumber(r.c20RequiredAh)} Ah
                </span>
                <span>.</span>
              </li>
              <li className="flex flex-wrap items-baseline gap-x-1">
                <span className="mr-1 font-bold text-cyan-700">+</span>
                <span>
                  Bộ cấp nguồn chính: Dòng điện nguồn chính theo tính toán
                  là{" "}
                </span>
                <KatexFormula
                  display={false}
                  math="I_{\mathrm{PSE}}"
                  className="!inline"
                />
                <span className="tabular-nums font-bold text-indigo-950">
                  {" = "}
                  {formatCalcNumber(r.ipseA)} A
                </span>
                <span>, dòng điện ở điều kiện báo cháy là </span>
                <KatexFormula display={false} math="I_A" className="!inline" />
                <span className="tabular-nums font-bold text-indigo-950">
                  {" = "}
                  {formatCalcNumber(r.iaA)} A
                </span>
                <span>, dòng điện nạp tối thiểu cho ắc quy là </span>
                <KatexFormula display={false} math="I_C" className="!inline" />
                <span className="tabular-nums font-bold text-indigo-950">
                  {" = "}
                  {formatCalcNumber(r.icA)} A
                </span>
                <span>.</span>
              </li>
            </ul>
          </div>
        )}
      </Card>
    </div>
  );
}
