"use client";

import { signOut } from "next-auth/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { BackupPump, Inputs, NamedLoad } from "@/domain/pccc-electric/models";
import { calcPcccElectric } from "@/domain/pccc-electric/calc";
import { validateInputs } from "@/domain/pccc-electric/validate";

type Props = { userEmail: string };

const defaultInputs: Inputs = {
  kdt: 1,
  kyc: 1,
  cosPhi: 0.8,
  kdp: 1.2,
  pumpsMain: [],
  otherLoads: [],
  backupPumps: [],
};

const resetInputs: Inputs = {
  ...defaultInputs,
  pumpsMain: [],
  otherLoads: [],
  backupPumps: [],
};

function Card({
  title,
  children,
  right,
  icon,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  right?: React.ReactNode;
  icon?: string;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2">
          {icon ? (
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-xs">
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
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
      type="number"
      value={Number.isFinite(value) ? value : 0}
      min={min}
      step={step}
      onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
    />
  );
}

function LoadsTable<T extends { name: string; kw: number; quantity: number }>({
  items,
  onChange,
  addLabel,
}: {
  items: T[];
  onChange: (next: T[]) => void;
  addLabel: string;
}) {
  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="w-12 px-3 py-2 text-left font-medium">#</th>
              <th className="px-3 py-2 text-left font-medium">Tên</th>
              <th className="w-24 px-3 py-2 text-left font-medium">Công suất định mức (KW)</th>
              <th className="w-20 px-3 py-2 text-left font-medium">Số lượng</th>
              <th className="w-12 px-3 py-2 text-left font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-zinc-500">
                  Chưa có thiết bị.
                </td>
              </tr>
            ) : (
              items.map((it, idx) => (
                <tr key={idx} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2">{idx + 1}</td>
                  <td className="px-3 py-2">
                    <input
                      className="w-full rounded-md border border-slate-200 px-2 py-1.5 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
                      value={it.name}
                      onChange={(e) => {
                        const next = items.slice();
                        next[idx] = { ...next[idx], name: e.target.value };
                        onChange(next);
                      }}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <NumberInput
                      value={it.kw}
                      min={0}
                      step={0.1}
                      onChange={(v) => {
                        const next = items.slice();
                        next[idx] = { ...next[idx], kw: v };
                        onChange(next);
                      }}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <NumberInput
                      value={it.quantity}
                      min={0}
                      step={1}
                      onChange={(v) => {
                        const next = items.slice();
                        next[idx] = {
                          ...next[idx],
                          quantity: Math.max(0, Math.round(v)),
                        };
                        onChange(next);
                      }}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <button
                      className="rounded-md border border-slate-200 px-2 py-1 text-slate-600 hover:bg-rose-50 hover:text-rose-700"
                      onClick={() => onChange(items.filter((_, i) => i !== idx))}
                      title="Xóa"
                      type="button"
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-100"
        onClick={() =>
          onChange([
            ...items,
            { name: `${addLabel} ${items.length + 1}`, kw: 0, quantity: 1 } as T,
          ])
        }
      >
        + Thêm
      </button>
    </div>
  );
}

function BackupTable({
  items,
  onChange,
}: {
  items: BackupPump[];
  onChange: (next: BackupPump[]) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="w-12 px-3 py-2 text-left font-medium">#</th>
              <th className="px-3 py-2 text-left font-medium">Tên bơm</th>
              <th className="w-24 px-3 py-2 text-left font-medium">Công suất định mức (KW)</th>
              <th className="w-20 px-3 py-2 text-left font-medium">Kkđ</th>
              <th className="w-12 px-3 py-2 text-left font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-zinc-500">
                  Chưa có bơm dự phòng.
                </td>
              </tr>
            ) : (
              items.map((it, idx) => (
                <tr key={idx} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2">{idx + 1}</td>
                  <td className="px-3 py-2">
                    <input
                      className="w-full rounded-md border border-slate-200 px-2 py-1.5 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
                      value={it.name}
                      onChange={(e) => {
                        const next = items.slice();
                        next[idx] = { ...next[idx], name: e.target.value };
                        onChange(next);
                      }}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <NumberInput
                      value={it.kw}
                      min={0}
                      step={0.1}
                      onChange={(v) => {
                        const next = items.slice();
                        next[idx] = { ...next[idx], kw: v };
                        onChange(next);
                      }}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <NumberInput
                      value={it.kkD}
                      min={0}
                      step={0.01}
                      onChange={(v) => {
                        const next = items.slice();
                        next[idx] = { ...next[idx], kkD: v };
                        onChange(next);
                      }}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <button
                      className="rounded-md border border-slate-200 px-2 py-1 text-slate-600 hover:bg-rose-50 hover:text-rose-700"
                      onClick={() => onChange(items.filter((_, i) => i !== idx))}
                      title="Xóa"
                      type="button"
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-100"
        onClick={() =>
          onChange([
            ...items,
            { name: `Bơm dự phòng ${items.length + 1}`, kw: 0, kkD: 1.3 },
          ])
        }
      >
        + Thêm bơm dự phòng
      </button>
    </div>
  );
}

export default function PcccElectricClient({ userEmail }: Props) {
  const [tab, setTab] = useState<"electric" | "tab2">("electric");
  const [inputs, setInputs] = useState<Inputs>(defaultInputs);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "loading" | "saved" | "error"
  >("idle");
  const [calculateError, setCalculateError] = useState<string | null>(null);
  const saveTimer = useRef<number | null>(null);

  const [results, setResults] = useState(() => calcPcccElectric(defaultInputs));
  const warnings = useMemo(() => validateInputs(inputs), [inputs]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setSaveStatus("loading");
      try {
        const res = await fetch("/api/state");
        if (!res.ok) throw new Error("load_failed");
        const j = (await res.json()) as { inputs?: Inputs };
        if (alive && j.inputs) {
          setInputs({
            ...j.inputs,
            pumpsMain: (j.inputs.pumpsMain ?? []).map((x) => ({
              ...x,
              quantity:
                typeof x.quantity === "number" && Number.isFinite(x.quantity)
                  ? x.quantity
                  : 1,
            })),
            otherLoads: (j.inputs.otherLoads ?? []).map((x) => ({
              ...x,
              quantity:
                typeof x.quantity === "number" && Number.isFinite(x.quantity)
                  ? x.quantity
                  : 1,
            })),
          });
        }
        if (alive) setSaveStatus("idle");
      } catch {
        if (alive) setSaveStatus("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      try {
        await fetch("/api/state", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ inputs }),
        });
        setSaveStatus("saved");
        window.setTimeout(() => setSaveStatus("idle"), 800);
      } catch {
        setSaveStatus("error");
      }
    }, 600);

    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [inputs]);

  async function exportExcel() {
    const res = await fetch("/api/export/excel", { method: "POST" });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pccc-dien.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportPdf() {
    const res = await fetch("/api/export/pdf", { method: "POST" });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pccc-dien.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleCalculate() {
    const hasEmptyName = [...inputs.pumpsMain, ...inputs.otherLoads, ...inputs.backupPumps].some(
      (item) => item.name.trim() === "",
    );
    if (hasEmptyName) {
      setCalculateError("Vui lòng nhập đầy đủ tên thiết bị/bơm trước khi tính toán.");
      return;
    }
    setCalculateError(null);
    setResults(calcPcccElectric(inputs));
  }

  return (
    <div className="min-h-screen bg-[#f3f6fb]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <div className="text-[32px] font-extrabold leading-tight tracking-tight text-slate-800">
              🔥 PHẦN MÊM TÍNH TOÁN PCCC
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-sm text-zinc-600 sm:block">
              {userEmail}
            </div>
            <button
              type="button"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-[40px] py-[32px]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 text-sm">
            <button
              className={`rounded-md px-3 py-2 font-semibold ${tab === "electric" ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-50"}`}
              onClick={() => setTab("electric")}
              type="button"
            >
              Điện PCCC
            </button>
            <button
              className={`rounded-md px-3 py-2 font-semibold ${tab === "tab2" ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-50"}`}
              onClick={() => setTab("tab2")}
              type="button"
            >
              Tab 2 (sắp có)
            </button>
          </div>

          <div className="text-xs text-zinc-500">
            {saveStatus === "loading"
              ? "Đang tải..."
              : saveStatus === "saved"
                ? "Đã lưu"
                : saveStatus === "error"
                  ? "Chưa lưu được (DB chưa sẵn sàng?)"
                  : ""}
          </div>
        </div>

        {tab === "tab2" ? (
          <Card title="Tab 2" icon="🧪">
            <div className="text-sm text-zinc-600">
              Tab này để bạn bổ sung công thức khác sau. Mình đã dựng sẵn cấu trúc
              2 tab để mở rộng mà không ảnh hưởng Tab 1.
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card title="Công thức tính toán" icon="📘">
              <div className="space-y-3 text-sm text-zinc-700">
                <div className="rounded-lg border border-sky-100 bg-sky-50/60 px-3 py-2">
                  <div className="font-bold">1) Phụ tải tính toán PCCC</div>
                  <div className="mt-1 font-mono text-[13px]">
                    P<sub>tt</sub> = K<sub>đt</sub> · ΣP<sub>i</sub> = K<sub>đt</sub> · (P
                    <sub>B</sub> + P<sub>KHÁC</sub>)
                  </div>
                </div>

                <div className="rounded-lg border border-sky-100 bg-sky-50/60 px-3 py-2">
                  <div className="font-bold">2) Công suất từng nhóm</div>
                  <div className="mt-1 font-mono text-[13px]">
                    P<sub>B/KHÁC</sub> = K<sub>yc</sub> · ΣP<sub>i</sub>
                  </div>
                  <div className="mt-1 font-mono text-[12px] text-slate-600">
                    P<sub>i</sub> = P<sub>đm</sub> × Số lượng
                  </div>
                </div>

                <div className="rounded-lg border border-sky-100 bg-sky-50/60 px-3 py-2">
                  <div className="font-bold">3) Máy biến áp</div>
                  <div className="mt-1 font-mono text-[13px]">
                    S<sub>MBA</sub> ≥ P<sub>tt</sub> / cosφ
                  </div>
                </div>

                <div className="rounded-lg border border-sky-100 bg-sky-50/60 px-3 py-2">
                  <div className="font-bold">4) Máy phát (khi có bơm dự phòng)</div>
                  <div className="mt-1 font-mono text-[13px]">
                    S<sub>MPĐ</sub> ≥ max(S<sub>tt</sub>, S<sub>kđ</sub>) · k<sub>dp</sub>
                  </div>
                  <div className="mt-2 grid gap-1 font-mono text-[13px] text-zinc-700">
                    <div>
                      S<sub>tt</sub> = P<sub>tt</sub> / cosφ
                    </div>
                    <div>
                      S<sub>kđ</sub> = P<sub>kđ</sub> / cosφ
                    </div>
                    <div>
                      P<sub>kđ</sub> = Σ(P<sub>đm</sub> · K<sub>kđ</sub>)
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card
                title={
                  <>
                    Nhóm phụ tải cấp nước chữa cháy chính (P<sub>B</sub>)
                  </>
                }
                icon="🚒"
              >
                <LoadsTable<NamedLoad>
                  items={inputs.pumpsMain}
                  onChange={(pumpsMain) => setInputs((s) => ({ ...s, pumpsMain }))}
                  addLabel="Thiết bị"
                />
                <div className="mt-3 text-xs text-zinc-500">
                  Kyc (hệ số yêu cầu) = 1 theo TCVN 9206:2012.
                </div>
              </Card>

              <Card
                title={
                  <>
                    Nhóm thiết bị phụ tải khác (P<sub>KHÁC</sub>)
                  </>
                }
                icon="💡"
              >
                <LoadsTable<NamedLoad>
                  items={inputs.otherLoads}
                  onChange={(otherLoads) => setInputs((s) => ({ ...s, otherLoads }))}
                  addLabel="Thiết bị"
                />
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card title="Bơm dự phòng (để tính máy phát)" icon="⚙️">
                <BackupTable
                  items={inputs.backupPumps}
                  onChange={(backupPumps) => setInputs((s) => ({ ...s, backupPumps }))}
                />
              </Card>

              <Card title="Tham số chung" icon="🔧">
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <div className="text-xs font-medium text-zinc-700">Kđt</div>
                    <NumberInput
                      value={inputs.kdt}
                      step={0.01}
                      min={0}
                      onChange={(kdt) => setInputs((s) => ({ ...s, kdt }))}
                    />
                  </label>
                  <label className="block">
                    <div className="text-xs font-medium text-zinc-700">Kyc</div>
                    <NumberInput
                      value={inputs.kyc}
                      step={0.01}
                      min={0}
                      onChange={(kyc) => setInputs((s) => ({ ...s, kyc }))}
                    />
                  </label>
                  <label className="block">
                    <div className="text-xs font-medium text-zinc-700">cosφ</div>
                    <NumberInput
                      value={inputs.cosPhi}
                      step={0.01}
                      min={0}
                      onChange={(cosPhi) => setInputs((s) => ({ ...s, cosPhi }))}
                    />
                    <div className="mt-1 text-[11px] text-zinc-500">
                      Khuyến nghị: 0.80–0.85
                    </div>
                  </label>
                  <label className="block">
                    <div className="text-xs font-medium text-zinc-700">kdp</div>
                    <NumberInput
                      value={inputs.kdp}
                      step={0.01}
                      min={0}
                      onChange={(kdp) => setInputs((s) => ({ ...s, kdp }))}
                    />
                    <div className="mt-1 text-[11px] text-zinc-500">
                      Khuyến nghị: 1.10–1.25
                    </div>
                  </label>
                </div>

                {warnings.length ? (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    <div className="font-medium">Lưu ý</div>
                    <ul className="mt-1 list-disc pl-5">
                      {warnings.map((x) => (
                        <li key={x.code}>{x.message}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                    onClick={handleCalculate}
                  >
                    ⚡ Tính toán
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100"
                    onClick={() => {
                      setInputs(resetInputs);
                      setResults(calcPcccElectric(resetInputs));
                      setCalculateError(null);
                    }}
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    onClick={exportExcel}
                  >
                    Xuất Excel
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    onClick={exportPdf}
                  >
                    Xuất PDF
                  </button>
                </div>
                {calculateError ? (
                  <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                    {calculateError}
                  </div>
                ) : null}
              </Card>
            </div>

            <Card title="Kết quả tính toán" icon="✅">
              <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                  <div className="text-xs text-zinc-500">
                    P<sub>B</sub> – Nhóm phụ tải cấp nước chữa cháy chính
                  </div>
                  <div className="text-2xl font-semibold tracking-tight">
                    {results.pb.toFixed(1)} <span className="text-base font-medium">kW</span>
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                  <div className="text-xs text-zinc-500">
                    P<sub>KHÁC</sub> – Nhóm thiết bị phụ tải khác
                  </div>
                  <div className="text-2xl font-semibold tracking-tight">
                    {results.pkhac.toFixed(1)} <span className="text-base font-medium">kW</span>
                  </div>
                </div>
                <div className="rounded-lg border border-blue-200 bg-blue-50/60 px-4 py-3">
                  <div className="text-xs text-zinc-500">
                    P<sub>tt</sub> – Tổng phụ tải tính toán
                  </div>
                  <div className="text-2xl font-semibold tracking-tight">
                    {results.ptt.toFixed(1)} <span className="text-base font-medium">kW</span>
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                  <div className="text-xs text-zinc-500">
                    S<sub>MBA</sub> – Công suất biểu kiến tối thiểu
                  </div>
                  <div className="text-2xl font-semibold tracking-tight">
                    {results.smba.toFixed(1)} <span className="text-base font-medium">kVA</span>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 lg:col-span-2">
                  <div className="text-sm font-bold tracking-tight">
                    Máy phát điện dự phòng (khi có bơm dự phòng)
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-zinc-700">
                    <div className="flex items-center justify-between">
                      <span>
                        P<sub>kđ</sub>
                      </span>
                      <span className="font-mono">{results.pkd.toFixed(1)} kW</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>
                        S<sub>tt</sub>
                      </span>
                      <span className="font-mono">{results.stt.toFixed(1)} kVA</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>
                        S<sub>kđ</sub>
                      </span>
                      <span className="font-mono">{results.skd.toFixed(1)} kVA</span>
                    </div>
                    <div className="flex items-center justify-between border-t pt-2">
                      <span className="font-medium">
                        S<sub>MPĐ</sub> tối thiểu
                      </span>
                      <span className="font-mono font-semibold">
                        {results.smpd.toFixed(1)} kVA
                      </span>
                    </div>
                  </div>

                  {inputs.backupPumps.length === 0 ? (
                    <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
                      Để tính máy phát điện, hãy thêm bơm dự phòng ở danh sách bên trái.
                    </div>
                  ) : null}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

