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
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
}) {
  return (
    <input
      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
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
  iconTone = "amber",
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  icon?: string;
  right?: React.ReactNode;
  iconTone?: "amber" | "sky";
}) {
  const iconBg = iconTone === "sky" ? "bg-sky-100" : "bg-amber-100";
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          {icon ? (
            <span
              className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${iconBg}`}
            >
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
      <div className="text-sm font-semibold text-slate-800">{title}</div>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
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
          <thead className="bg-slate-50 text-left text-slate-700">
            <tr>
              <th className="px-3 py-2 font-medium">STT</th>
              <th className="px-3 py-2 font-medium">Tên</th>
              <th className="px-3 py-2 font-medium">Số lượng</th>
              <th className="px-3 py-2 font-medium">
                <span className="inline-flex flex-wrap items-baseline gap-x-1">
                  Dòng tiêu thụ mỗi thiết bị <span>(mA)</span>
                </span>
              </th>
              <th className="px-3 py-2 font-medium">Dòng tiêu thụ (mA)</th>
              <th className="px-3 py-2 font-medium">Trạng thái</th>
              <th className="px-1 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-zinc-500">
                  Chưa có thiết bị.
                </td>
              </tr>
            ) : (
              rows.map((r, idx) => {
                const line = lineTotals[idx] ?? 0;
                return (
                  <tr
                    key={idx}
                    className="border-t border-slate-100 hover:bg-slate-50/80"
                  >
                    <td className="px-5 py-2 text-left">{idx + 1}</td>
                    <td className="min-w-0 px-3 py-2">
                      <input
                        className="w-full rounded-md border border-slate-200 px-2 py-1.5 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
                        value={r.name}
                        onChange={(e) =>
                          updateRow(idx, { name: e.target.value })
                        }
                        placeholder="Tên thiết bị"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <NumberInput
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
                        value={r.mAEach}
                        min={0}
                        step={0.1}
                        onChange={(m) => updateRow(idx, { mAEach: m })}
                      />
                    </td>
                    <td className="px-3 py-2 font-sans tabular-nums text-slate-700">
                      {formatCalcNumber(line)}
                    </td>
                    <td className="px-3 py-2 text-slate-600">{statusLabel}</td>
                    <td className="px-1 py-2">
                      <button
                        type="button"
                        className="rounded-md border border-slate-200 px-2 py-1 text-slate-600 hover:bg-rose-50 hover:text-rose-700"
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
              <tr className="border-t-2 border-slate-200 bg-slate-50/80 font-medium">
                <td className="px-3 py-2" colSpan={4}>
                  Tổng dòng tiêu thụ (mA)
                </td>
                <td className="px-3 py-2 font-sans tabular-nums">
                  {formatCalcNumber(totalMA)}
                </td>
                <td className="px-3 py-2" colSpan={2} />
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-100"
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
  calculateError: string | null;
};

export default function FireBatteryTab({
  inputs,
  onChange,
  results: r,
  onCalculate,
  onReset,
  calculateError,
}: Props) {
  const [formulaPanelOpen, setFormulaPanelOpen] = useState(true);

  return (
    <div className="space-y-6 font-sans">
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <h2 className="text-center text-base font-bold uppercase leading-snug tracking-tight text-slate-800 sm:text-lg">
          Bảng tính nguồn cấp điện cho hệ thống báo cháy tự động
        </h2>
      </div>

      <Card
        title="Công thức tính toán"
        icon="📘"
        iconTone="sky"
        right={
          <button
            type="button"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            onClick={() => setFormulaPanelOpen((v) => !v)}
            aria-expanded={formulaPanelOpen}
          >
            {formulaPanelOpen ? "Đóng" : "Mở"}
          </button>
        }
      >
        {formulaPanelOpen ? (
          <div className="space-y-3 text-sm text-zinc-700">
            <div className="rounded-lg border border-sky-100 bg-sky-50/60 px-3 py-2">
              <div className="font-bold">
                1) Dòng điện tổng trạng thái tĩnh{" "}
                <KatexFormula display={false} math="I_Q" className="!inline" />
              </div>
              <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-800">
                <KatexFormula math="I_{Q} = \displaystyle\sum_{i=1}^{n} I_i" />
              </div>
              <ul className="space-y-1 text-sm text-slate-700">
                <li className="flex flex-wrap items-baseline gap-x-1.5">
                  <span>•</span>
                  <KatexFormula
                    display={false}
                    math="I_i = I_{tt} \cdot \text{Số lượng}"
                  />
                </li>
              </ul>
            </div>

            <div className="rounded-lg border border-sky-100 bg-sky-50/60 px-3 py-2">
              <div className="font-bold">
                2) Dòng điện tổng trạng thái báo cháy{" "}
                <KatexFormula display={false} math="I_A" className="!inline" />
              </div>
              <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-800">
                <KatexFormula math="I_{A} = \displaystyle\sum_{i=1}^{n} I_i" />
              </div>
              <ul className="space-y-1 text-sm text-slate-700">
                <li className="flex flex-wrap items-baseline gap-x-1.5">
                  <span>•</span>
                  <KatexFormula
                    display={false}
                    math="I_i = I_{tt} \cdot \text{Số lượng}"
                  />
                </li>
              </ul>
            </div>

            <div className="rounded-lg border border-sky-100 bg-sky-50/60 px-3 py-2">
              <div className="font-bold">
                3) Dung lượng ắc quy{" "}
                <KatexFormula
                  display={false}
                  math="C_{20}"
                  className="!inline"
                />
              </div>
              <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-800">
                <KatexFormula math="C_{20} = 1{,}25 \cdot \bigl[(I_Q \cdot T_Q) + F_C \cdot (I_A \cdot T_A)\bigr]" />
              </div>
              <ul className="space-y-1 text-sm text-slate-700">
                <li className="flex flex-wrap items-baseline gap-x-1.5">
                  <span>•</span>
                  <KatexFormula display={false} math="1{,}25" />
                  <span>: Hệ số gây hư hỏng ắc quy</span>
                </li>
                <li className="flex flex-wrap items-baseline gap-x-1.5">
                  <span>•</span>
                  <KatexFormula display={false} math="I_Q" />
                  <span>: Dòng điện tổng ở tải trọng tĩnh</span>
                </li>
                <li className="flex flex-wrap items-baseline gap-x-1.5">
                  <span>•</span>
                  <KatexFormula display={false} math="T_Q" />
                  <span>
                    : Thời gian của nguồn điện dự phòng ở tải trọng tĩnh (thường
                    là 24 h)
                  </span>
                </li>
                <li className="flex flex-wrap items-baseline gap-x-1.5">
                  <span>•</span>
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
                  <span>•</span>
                  <KatexFormula display={false} math="I_A" />
                  <span>: Dòng điện tổng ở điều kiện báo cháy</span>
                </li>
                <li className="flex flex-wrap items-baseline gap-x-1.5">
                  <span>•</span>
                  <KatexFormula display={false} math="T_A" />
                  <span>
                    : Thời gian của nguồn điện dự phòng ở phụ tải toàn tải
                    (thường là 0,5 h)
                  </span>
                </li>
              </ul>
            </div>

            <div className="rounded-lg border border-sky-100 bg-sky-50/60 px-3 py-2">
              <div className="font-bold">
                4) Dòng điện nạp tối thiểu{" "}
                <KatexFormula display={false} math="I_C" className="!inline" />
              </div>
              <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-800">
                <KatexFormula math="I_C = \dfrac{1{,}25 \cdot \bigl[(I_Q \cdot 5) + (I_A \cdot 0{,}5)\bigr]}{24}" />
              </div>
              <ul className="space-y-1 text-sm text-slate-700">
                <li className="flex flex-wrap items-baseline gap-x-1.5">
                  <span>•</span>
                  <KatexFormula display={false} math="1{,}25" />
                  <span>
                    : Hệ số nâng thêm để tránh tổn thất trong quá trình nạp
                  </span>
                </li>
                <li className="flex flex-wrap items-baseline gap-x-1.5">
                  <span>•</span>
                  <KatexFormula display={false} math="I_Q" />
                  <span>: Dòng điện tổng ở tải trọng tĩnh</span>
                </li>

                <li className="flex flex-wrap items-baseline gap-x-1.5">
                  <span>•</span>
                  <KatexFormula display={false} math="I_A" />
                  <span>: Dòng điện tổng ở điều kiện báo cháy</span>
                </li>
                <li className="flex flex-wrap items-baseline gap-x-1.5">
                  <span>•</span>
                  <KatexFormula display={false} math="24" />
                  <span>: Thời gian nạp lại (giờ) — nạp trong vòng 24h</span>
                </li>
                <li className="flex flex-wrap items-baseline gap-x-1.5">
                  <span>•</span>
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

            <div className="rounded-lg border border-sky-100 bg-sky-50/60 px-3 py-2">
              <div className="font-bold">
                5) Dòng điện tổng nguồn chính{" "}
                <KatexFormula
                  display={false}
                  math="I_{\mathrm{PSE}}"
                  className="!inline"
                />
              </div>
              <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-800">
                <KatexFormula math="I_{\mathrm{PSE}} = I_Q + I_C" />
              </div>
              <ul className="space-y-1 text-sm text-slate-700">
                <li className="flex flex-wrap items-baseline gap-x-1.5">
                  <span>•</span>
                  <KatexFormula display={false} math="I_Q" />
                  <span>: Dòng điện tổng trạng thái tĩnh</span>
                </li>
                <li className="flex flex-wrap items-baseline gap-x-1.5">
                  <span>•</span>
                  <KatexFormula display={false} math="I_C" />
                  <span>: Dòng điện nạp tối thiểu</span>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">
            Đang ẩn phần công thức. Bấm{" "}
            <span className="font-medium text-slate-700">Mở</span> ở góc phải để
            mở lại.
          </p>
        )}
      </Card>

      <div>
        <h2 className="text-lg font-bold text-slate-800">
          TÍNH TOÁN DUNG LƯỢNG ÁC QUY DỰ PHÒNG
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
            <span className="inline-flex flex-wrap items-baseline gap-x-1 text-xs font-medium text-slate-700">
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
            <span className="inline-flex flex-wrap items-baseline gap-x-1 text-xs font-medium text-slate-700">
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
            <span className="inline-flex flex-wrap items-baseline gap-x-1 text-xs font-medium text-slate-700">
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
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            onClick={onCalculate}
          >
            ⚡ Tính toán
          </button>
          <button
            type="button"
            className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100"
            onClick={onReset}
          >
            Reset
          </button>
        </div>
        {calculateError ? (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {calculateError}
          </div>
        ) : null}
      </Card>

      <Card title="Kết quả tính toán" icon="✅">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
            <div className="flex flex-wrap items-baseline gap-x-1 text-xs text-zinc-500">
              <KatexFormula display={false} math="I_Q" className="!inline" />
              <span>— Dòng tĩnh (A)</span>
            </div>
            <div className="text-2xl font-semibold tabular-nums tracking-tight">
              {formatCalcNumber(r.iqA)}{" "}
              <span className="text-base font-medium">A</span>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
            <div className="flex flex-wrap items-baseline gap-x-1 text-xs text-zinc-500">
              <KatexFormula display={false} math="I_A" className="!inline" />
              <span>— Dòng báo cháy (A)</span>
            </div>
            <div className="text-2xl font-semibold tabular-nums tracking-tight">
              {formatCalcNumber(r.iaA)}{" "}
              <span className="text-base font-medium">A</span>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
            <div className="flex flex-wrap items-baseline gap-x-1 text-xs text-zinc-500">
              <KatexFormula display={false} math="C_{20}" className="!inline" />
              <span>— Dung lượng ác quy (Ah)</span>
            </div>
            <div className="text-2xl font-semibold tabular-nums tracking-tight">
              {formatCalcNumber(r.c20RequiredAh)}{" "}
              <span className="text-base font-medium">Ah</span>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
            <div className="flex flex-wrap items-baseline gap-x-1 text-xs text-zinc-500">
              <KatexFormula display={false} math="I_C" className="!inline" />
              <span>— Dòng nạp tối thiểu (A)</span>
            </div>
            <div className="text-2xl font-semibold tabular-nums tracking-tight">
              {formatCalcNumber(r.icA)}{" "}
              <span className="text-base font-medium">A</span>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
            <div className="flex flex-wrap items-baseline gap-x-1 text-xs text-zinc-500">
              <KatexFormula
                display={false}
                math="I_{\mathrm{PSE}}"
                className="!inline"
              />
              <span>— Dòng tổng nguồn (A)</span>
            </div>
            <div className="text-2xl font-semibold tabular-nums tracking-tight">
              {formatCalcNumber(r.ipseA)}{" "}
              <span className="text-base font-medium">A</span>
            </div>
          </div>
        </div>

        {r.c20RequiredAh === 0 ? (
          <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
            Để tính dung lượng ác quy dự phòng, hãy thêm thiết bị.
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-3">
            <div className="text-sm font-bold text-slate-800">Kết luận</div>
            <p className="mt-2 text-sm leading-relaxed text-slate-800">
              Như vậy, theo kết quả tính toán, lựa chọn nguồn điện cho hệ thống
              báo cháy như sau:
            </p>
            <ul className="mt-3 list-none space-y-3 text-sm leading-relaxed text-slate-800">
              <li className="flex flex-wrap items-baseline gap-x-1 pl-0">
                <span className="mr-1 font-semibold text-slate-900">+</span>
                <span>
                  Ắc quy dự phòng có dung lượng thấp nhất theo tính toán là{" "}
                </span>
                <KatexFormula
                  display={false}
                  math="C_{20}"
                  className="!inline"
                />
                <span className="tabular-nums font-semibold text-slate-900">
                  {" = "}
                  {formatCalcNumber(r.c20RequiredAh)} Ah
                </span>
                <span>.</span>
              </li>
              <li className="flex flex-wrap items-baseline gap-x-1">
                <span className="mr-1 font-semibold text-slate-900">+</span>
                <span>
                  Bộ cấp nguồn chính: Dòng điện nguồn chính theo tính toán
                  là{" "}
                </span>
                <KatexFormula
                  display={false}
                  math="I_{\mathrm{PSE}}"
                  className="!inline"
                />
                <span className="tabular-nums font-semibold text-slate-900">
                  {" = "}
                  {formatCalcNumber(r.ipseA)} A
                </span>
                <span>, dòng điện ở điều kiện báo cháy là </span>
                <KatexFormula display={false} math="I_A" className="!inline" />
                <span className="tabular-nums font-semibold text-slate-900">
                  {" = "}
                  {formatCalcNumber(r.iaA)} A
                </span>
                <span>, dòng điện nạp tối thiểu cho ắc quy là </span>
                <KatexFormula display={false} math="I_C" className="!inline" />
                <span className="tabular-nums font-semibold text-slate-900">
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
