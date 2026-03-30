"use client";

import { useState } from "react";
import type {
  FireBatteryInputs,
  FireBatteryResults,
} from "@/domain/fire-battery/models";
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
                Dòng tiêu thụ mỗi thiết bị (mA)
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
                    <td className="px-3 py-2 text-slate-600">{idx + 1}</td>
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
                    <td className="px-3 py-2 font-mono text-slate-700">
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
                <td className="px-3 py-2 font-mono">
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
    <div className="space-y-6">
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
                B1 — Dòng điện tổng trạng thái tĩnh I<sub>Q</sub>
              </div>
              <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-center text-sm font-medium text-blue-700">
                I<sub>Q</sub> = ΣI<sub>i</sub>
              </div>
              <ul className="space-y-1 text-sm text-slate-700">
                <li>
                  • I<sub>i</sub> = I<sub>tt</sub> × Số lượng
                </li>
              </ul>
            </div>

            <div className="rounded-lg border border-sky-100 bg-sky-50/60 px-3 py-2">
              <div className="font-bold">
                B2 — Dòng điện tổng trạng thái báo cháy I<sub>A</sub>
              </div>
              <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-center text-sm font-medium text-blue-700">
                I<sub>A</sub> = ΣI<sub>i</sub>
              </div>
              <ul className="space-y-1 text-sm text-slate-700">
                <li>
                  • I<sub>i</sub> = I<sub>tt</sub> × Số lượng
                </li>
              </ul>
            </div>

            <div className="rounded-lg border border-sky-100 bg-sky-50/60 px-3 py-2">
              <div className="font-bold">B3 — Dung lượng ắc quy C20</div>
              <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-center text-sm font-medium text-blue-700">
                C<sub>20</sub> = 1,25 × [(I<sub>Q</sub> × T<sub>Q</sub>) + F
                <sub>C</sub> × (I<sub>A</sub> × T<sub>A</sub>)]
              </div>
              <ul className="space-y-1 text-sm text-slate-700">
                <li>
                  • C<sub>20</sub>: Dung lượng ắc quy
                </li>
                <li>• 1,25: Hệ số gây hư hỏng ắc quy</li>
                <li>
                  • I<sub>Q</sub>: Dòng điện tổng ở tải trọng tĩnh
                </li>
                <li>
                  • T<sub>Q</sub>: Thời gian của nguồn điện dự phòng ở tải trọng
                  tĩnh (thường là 24 h)
                </li>
                <li>
                  • F<sub>C</sub>: Hệ số giảm dung lượng của ắc quy ở I
                  <sub>A</sub>
                </li>
                <li>
                  • I<sub>A</sub>: Dòng điện tổng ở điều kiện báo cháy
                </li>
                <li>
                  • T<sub>A</sub>: Thời gian của nguồn điện dự phòng ở phụ tải
                  toàn tải (thường là 0,5 h)
                </li>
              </ul>
            </div>

            <div className="rounded-lg border border-sky-100 bg-sky-50/60 px-3 py-2">
              <div className="font-bold">
                B4 — Dòng điện nạp tối thiểu I<sub>C</sub>
              </div>
              <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-center text-sm font-medium text-blue-700">
                I<sub>C</sub> = 1,25 × [(I<sub>Q</sub> × 5) + (I<sub>A</sub> ×
                0,5)] / 24
              </div>
              <ul className="space-y-1 text-sm text-slate-700">
                <li>
                  • I<sub>C</sub>: Dòng điện nạp tối thiểu
                </li>
                <li>
                  • 1,25: Hệ số nâng thêm để tránh tổn thất trong quá trình nạp
                </li>
                <li>
                  • I<sub>Q</sub>: Dòng điện tổng ở tải trọng tĩnh
                </li>

                <li>
                  • I<sub>A</sub>: Dòng điện tổng ở điều kiện báo cháy
                </li>
                <li>• 24: Thời gian nạp lại (giờ) Nạp trong vòng 24h</li>
                <li>
                  • 5 & 0.5: Thời gian ắc quy duy trì hệ thống báo cháy với tải
                  trọng tĩnh bình thường (5h) và ở điều kiện báo cháy là 30 phút
                  (0.5h)
                </li>
              </ul>
            </div>

            <div className="rounded-lg border border-sky-100 bg-sky-50/60 px-3 py-2">
              <div className="font-bold">
                B5 — Dòng điện tổng nguồn I<sub>PSE</sub>
              </div>
              <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-center text-sm font-medium text-blue-700">
                I<sub>PSE</sub> = I<sub>Q</sub> + I<sub>C</sub>
              </div>
              <ul className="space-y-1 text-sm text-slate-700">
                <li>
                  • I<sub>Q</sub>: Dòng điện tổng ở tải trọng tĩnh
                </li>
                <li>
                  • I<sub>C</sub>: Dòng điện nạp tối thiểu
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
          Kiểm tra nguồn điện dự phòng
        </h2>
      </div>

      <Card
        title={
          <>
            Dòng điện tiêu thụ tĩnh (I<sub>Q</sub>)
          </>
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
          <>
            Dòng điện tiêu thụ khi báo cháy (I<sub>A</sub>)
          </>
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="text-xs font-medium text-slate-700">
              T<sub>Q</sub> (h) — tải tĩnh
            </span>
            <NumberInput
              value={inputs.tqHours}
              min={0}
              step={0.5}
              onChange={(tqHours) => onChange({ ...inputs, tqHours })}
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-700">
              T<sub>A</sub> (h) — báo cháy
            </span>
            <NumberInput
              value={inputs.taHours}
              min={0}
              step={0.1}
              onChange={(taHours) => onChange({ ...inputs, taHours })}
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-700">
              F<sub>C</sub> — hệ số giảm dung lượng (I<sub>A</sub>)
            </span>
            <NumberInput
              value={inputs.fc}
              min={0}
              step={0.01}
              onChange={(fc) => onChange({ ...inputs, fc })}
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-700">
              C20 lắp đặt (Ah) — B6
            </span>
            <NumberInput
              value={inputs.ratedC20Ah}
              min={0}
              step={0.1}
              onChange={(ratedC20Ah) => onChange({ ...inputs, ratedC20Ah })}
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
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
            <div className="text-xs text-zinc-500">
              I<sub>Q</sub> — Dòng tĩnh (A)
            </div>
            <div className="text-2xl font-semibold tracking-tight">
              {formatCalcNumber(r.iqA)}{" "}
              <span className="text-base font-medium">A</span>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
            <div className="text-xs text-zinc-500">
              I<sub>A</sub> — Dòng báo cháy (A)
            </div>
            <div className="text-2xl font-semibold tracking-tight">
              {formatCalcNumber(r.iaA)}{" "}
              <span className="text-base font-medium">A</span>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-3 rounded-lg border border-amber-100 bg-amber-50/50 px-3 py-3 text-sm text-slate-800">
          <div>
            <span className="font-semibold">B3.</span>{" "}
            <span className="font-mono text-[13px]">
              C<sub>20</sub> = 1,25 × [(I<sub>Q</sub> × T<sub>Q</sub>) + F
              <sub>C</sub> × (I<sub>A</sub> × T<sub>A</sub>)]
            </span>
            <div className="mt-1 font-mono text-[13px]">
              = {formatCalcNumber(r.c20RequiredAh)} Ah
            </div>
          </div>
          <div>
            <span className="font-semibold">B4.</span>{" "}
            <span className="font-mono text-[13px]">
              I<sub>C</sub> = 1,25 × [(I<sub>Q</sub> × 5) + (I<sub>A</sub> ×
              0,5)] / 24
            </span>
            <div className="mt-1 text-xs text-slate-600">
              Dòng nạp tối thiểu (phục hồi sau 5 h tĩnh + 30 phút báo cháy trong
              24 h).
            </div>
            <div className="mt-1 font-mono text-[13px]">
              = {formatCalcNumber(r.icA)} A
            </div>
          </div>
          <div>
            <span className="font-semibold">B5.</span>{" "}
            <span className="font-mono text-[13px]">
              I<sub>PSE</sub> = I<sub>Q</sub> + I<sub>C</sub>
            </span>
            <div className="mt-1 font-mono text-[13px]">
              = {formatCalcNumber(r.ipseA)} A
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-3">
          <div className="text-sm font-bold text-slate-800">B6: Kết luận</div>
          {inputs.ratedC20Ah <= 0 ? (
            <p className="mt-2 text-sm text-slate-600">
              Nhập <strong>C20 lắp đặt (Ah)</strong> ở Tham số chung rồi bấm{" "}
              <strong>Tính toán</strong> để so sánh.
            </p>
          ) : r.batteryOk ? (
            <p className="mt-2 text-sm font-semibold text-emerald-700">
              Ắc quy <span className="underline">đảm bảo</span>: C20 lắp đặt ≥
              C20 yêu cầu ({formatCalcNumber(inputs.ratedC20Ah)} ≥{" "}
              {formatCalcNumber(r.c20RequiredAh)} Ah).
            </p>
          ) : (
            <p className="mt-2 text-sm font-semibold text-rose-700">
              Ắc quy <span className="underline">không đảm bảo</span>: C20 lắp
              đặt &lt; C20 yêu cầu ({formatCalcNumber(inputs.ratedC20Ah)} &lt;{" "}
              {formatCalcNumber(r.c20RequiredAh)} Ah).
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
