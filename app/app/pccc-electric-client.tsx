"use client";

import { signOut } from "next-auth/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { BackupPump, Inputs, NamedLoad } from "@/domain/pccc-electric/models";
import { calcPcccElectric } from "@/domain/pccc-electric/calc";
import { formatCalcNumber } from "@/domain/pccc-electric/format-calc-number";
import { validateInputs } from "@/domain/pccc-electric/validate";

type Props = { userEmail: string };

const defaultInputs: Inputs = {
  kdt: 1,
  kyc: 1,
  kkD: 1.3,
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
        <table className="w-full table-fixed text-sm">
          <colgroup>
            <col className="w-[10%]" />
            <col className="w-[40%]" />
            <col className="w-[30%]" />
            <col className="w-[20%]" />
            <col className="w-11" />
          </colgroup>
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-3 py-2 text-left font-medium">STT</th>
              <th className="px-3 py-2 text-left font-medium">Tên</th>
              <th className="px-3 py-2 text-left font-medium">Công suất định mức (KW)</th>
              <th className="px-3 py-2 text-left font-medium">Số lượng</th>
              <th className="px-1 py-2 text-left font-medium"></th>
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
                  <td className="px-6 py-2 text-left">{idx + 1}</td>
                  <td className="min-w-0 px-3 py-2">
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
                  <td className="min-w-0 px-3 py-2">
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
                  <td className="min-w-0 px-3 py-2">
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
                  <td className="px-1 py-2">
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
        <table className="w-full table-fixed text-sm">
          <colgroup>
            <col className="w-[10%]" />
            <col className="w-[40%]" />
            <col className="w-[30%]" />
            <col className="w-[20%]" />
            <col className="w-11" />
          </colgroup>
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-3 py-2 text-left font-medium">STT</th>
              <th className="px-3 py-2 text-left font-medium">Tên bơm</th>
              <th className="px-3 py-2 text-left font-medium">Công suất định mức (KW)</th>
              <th className="px-3 py-2 text-left font-medium">Số lượng</th>
              <th className="px-1 py-2 text-left font-medium"></th>
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
                  <td className="px-6 py-2 text-left">{idx + 1}</td>
                  <td className="min-w-0 px-3 py-2">
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
                  <td className="min-w-0 px-3 py-2">
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
                  <td className="min-w-0 px-3 py-2">
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
                  <td className="px-1 py-2">
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
            { name: `Bơm dự phòng ${items.length + 1}`, kw: 0, quantity: 1 },
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
  const [formulaPanelOpen, setFormulaPanelOpen] = useState(true);
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
          const raw = j.inputs;
          const legacyKkD =
            typeof raw.kkD === "number" && Number.isFinite(raw.kkD)
              ? raw.kkD
              : (() => {
                  const first = raw.backupPumps?.[0] as { kkD?: number } | undefined;
                  return typeof first?.kkD === "number" && Number.isFinite(first.kkD)
                    ? first.kkD
                    : defaultInputs.kkD;
                })();
          setInputs({
            ...defaultInputs,
            ...raw,
            kkD: legacyKkD,
            pumpsMain: (raw.pumpsMain ?? []).map((x) => ({
              ...x,
              quantity:
                typeof x.quantity === "number" && Number.isFinite(x.quantity)
                  ? x.quantity
                  : 1,
            })),
            otherLoads: (raw.otherLoads ?? []).map((x) => ({
              ...x,
              quantity:
                typeof x.quantity === "number" && Number.isFinite(x.quantity)
                  ? x.quantity
                  : 1,
            })),
            backupPumps: (raw.backupPumps ?? []).map((x) => ({
              name: typeof x.name === "string" ? x.name : "",
              kw: typeof x.kw === "number" && Number.isFinite(x.kw) ? x.kw : 0,
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
        <div className="relative mx-auto flex min-h-[52px] w-full max-w-[1600px] items-center justify-center px-0 py-3 sm:min-h-[56px] sm:px-0 sm:py-4">
          <h1 className="text-balance px-2 text-center text-xl font-extrabold leading-tight tracking-tight text-slate-800 sm:max-w-[calc(100%-15rem)] sm:text-[28px] md:max-w-[calc(100%-18rem)] md:text-[32px]">
            🔥 PHẦN MỀM TÍNH TOÁN PCCC
          </h1>
          <div className="absolute right-2 top-1/2 z-10 flex max-w-[min(calc(100%-8rem),20rem)] -translate-y-1/2 items-center gap-2 sm:right-2 sm:gap-3 md:max-w-sm pr-8">
            <span className="hidden min-w-0 flex-1 truncate text-right text-sm text-zinc-600 sm:inline">
              {userEmail}
            </span>
            <button
              type="button"
              className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
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
            <Card
              title="Công thức tính toán"
              icon="📘"
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
                    <div className="font-bold">1) Phụ tải tính toán PCCC</div>
                    <div className="mt-1 font-mono text-[13px]">
                      P<sub>tt</sub> = K<sub>đt</sub> · ΣP<sub>i</sub> = K<sub>đt</sub> · (P
                      <sub>B</sub> · K<sub>kđ</sub> + P<sub>BC</sub>)
                    </div>
                  </div>

                  <div className="rounded-lg border border-sky-100 bg-sky-50/60 px-3 py-2">
                    <div className="font-bold">2) Công suất từng thiết bị</div>
                    <div className="mt-1 font-mono text-[13px]">
                      P<sub>B/BC</sub> = K<sub>yc</sub> · ΣP<sub>i</sub>
                    </div>
                    <div className="mt-1 font-mono text-[12px] text-slate-600">
                      P<sub>i</sub> = P<sub>đm</sub> × Số lượng
                    </div>
                  </div>

                  <div className="rounded-lg border border-sky-100 bg-sky-50/60 px-3 py-2">
                    <div className="font-bold">3) Công suất biểu kiến máy biến áp</div>
                    <div className="mt-1 font-mono text-[13px]">
                      S<sub>MBA</sub> ≥ P<sub>tt</sub> / cosφ
                    </div>
                  </div>

                  <div className="rounded-lg border border-sky-100 bg-sky-50/60 px-3 py-2">
                    <div className="font-bold">4) Công suất máy phát điện (khi có máy bơm động cơ điện dự phòng)</div>
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
                        P<sub>kđ</sub> = K<sub>kđ</sub> · Σ(P<sub>đm</sub> × SL)
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-zinc-500">
                  Đang ẩn phần công thức. Bấm <span className="font-medium text-slate-700">Mở</span>{" "}
                  ở góc phải để mở lại.
                </p>
              )}
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
              </Card>

              <Card
                title={
                  <>
                    Nhóm thiết bị phụ tải báo cháy (P<sub>BC</sub>)
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
                    <div className="text-xs font-medium text-zinc-700">K<sub>đt</sub></div>
                    <NumberInput
                      value={inputs.kdt}
                      step={0.01}
                      min={0}
                      onChange={(kdt) => setInputs((s) => ({ ...s, kdt }))}
                    />
                  </label>
                  <label className="block">
                    <div className="text-xs font-medium text-zinc-700">K<sub>yc</sub></div>
                    <NumberInput
                      value={inputs.kyc}
                      step={0.01}
                      min={0}
                      onChange={(kyc) => setInputs((s) => ({ ...s, kyc }))}
                    />
                  </label>
                  <label className="block">
                    <div className="text-xs font-medium text-zinc-700">K<sub>kđ</sub></div>
                    <NumberInput
                      value={inputs.kkD}
                      step={0.01}
                      min={0}
                      onChange={(kkD) => setInputs((s) => ({ ...s, kkD }))}
                    />
                    <div className="mt-1 text-[11px] text-zinc-500">
                      Dùng cho P<sub>tt</sub> (MBA) và P<sub>kđ</sub> (bơm dự phòng)
                    </div>
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
                    <div className="text-xs font-medium text-zinc-700">K<sub>dp</sub></div>
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
                    {formatCalcNumber(results.pb)} <span className="text-base font-medium">kW</span>
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                  <div className="text-xs text-zinc-500">
                    P<sub>BC</sub> – Nhóm thiết bị phụ tải khác
                  </div>
                  <div className="text-2xl font-semibold tracking-tight">
                    {formatCalcNumber(results.pkhac)} <span className="text-base font-medium">kW</span>
                  </div>
                </div>
                <div className="rounded-lg border border-blue-200 bg-blue-50/60 px-4 py-3">
                  <div className="text-xs text-zinc-500">
                    P<sub>tt</sub> – Tổng phụ tải tính toán (MBA)
                  </div>
                  <div className="mt-0.5 text-[11px] leading-snug text-zinc-500">
                    K<sub>đt</sub> · (P<sub>B</sub> · K<sub>kđ</sub> + P<sub>BC</sub>) —{" "}
                    <span className="font-medium text-zinc-600">không</span> gồm bơm dự phòng
                  </div>
                  <div className="mt-1 text-2xl font-semibold tracking-tight">
                    {formatCalcNumber(results.ptt)} <span className="text-base font-medium">kW</span>
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                  <div className="text-xs text-zinc-500">
                    S<sub>MBA</sub> – Công suất biểu kiến tối thiểu
                  </div>
                  <div className="text-2xl font-semibold tracking-tight">
                    {formatCalcNumber(results.smba)} <span className="text-base font-medium">kVA</span>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 lg:col-span-2">
                  <div className="text-sm font-bold tracking-tight">
                    Công suất máy phát điện dự phòng cho bơm chữa cháy
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-zinc-700">
                    <div className="flex items-center justify-between">
                      <span>
                        P<sub>tt</sub>
                      </span>
                      <span className="font-mono">{formatCalcNumber(results.pttBackup)} kW</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>
                        P<sub>kđ</sub>
                      </span>
                      <span className="font-mono">{formatCalcNumber(results.pkd)} kW</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>
                        S<sub>tt</sub>
                      </span>
                      <span className="font-mono">{formatCalcNumber(results.stt)} kVA</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>
                        S<sub>kđ</sub>
                      </span>
                      <span className="font-mono">{formatCalcNumber(results.skd)} kVA</span>
                    </div>
                    <div className="flex items-center justify-between border-t pt-2">
                      <span className="font-medium">
                        S<sub>MPĐ</sub> tối thiểu
                      </span>
                      <span className="font-mono font-semibold">
                        {formatCalcNumber(results.smpd)} kVA
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

