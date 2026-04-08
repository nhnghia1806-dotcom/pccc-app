"use client";

import { signOut } from "next-auth/react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  createDefaultProjectMeta,
  toAppSavedJson,
  type ProjectMeta,
} from "@/domain/app-saved";
import type {
  BackupPump,
  Inputs,
  NamedLoad,
} from "@/domain/pccc-electric/models";
import { calcPcccElectric } from "@/domain/pccc-electric/calc";
import { formatCalcNumber } from "@/domain/pccc-electric/format-calc-number";
import { validateInputs } from "@/domain/pccc-electric/validate";
import { calcFireBattery } from "@/domain/fire-battery/calc";
import { createDefaultFireBatteryInputs } from "@/domain/fire-battery/defaults";
import { KatexFormula } from "@/components/katex-formula";
import FireBatteryTab from "./fire-battery-tab";

type Props = { userEmail: string };

const defaultInputs: Inputs = {
  kyc: 1,
  kkD: 1,
  cosPhi: 0.8,
  kdp: 1.2,
  pumpsMain: [],
  backupPumps: [],
};

const resetInputs: Inputs = {
  ...defaultInputs,
  pumpsMain: [],
  backupPumps: [],
};

function Card({
  title,
  children,
  right,
  icon,
  variant = "neutral",
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  right?: React.ReactNode;
  icon?: string;
  /** neutral: xám (dùng chung). pump: chủ đề trạm bơm (cùng palette indigo/blue với tab báo cháy) */
  variant?: "neutral" | "pump";
}) {
  const isPump = variant === "pump";
  return (
    <section
      className={
        isPump
          ? "overflow-hidden rounded-2xl border border-indigo-200/70 bg-white shadow-md shadow-indigo-900/10 ring-1 ring-indigo-900/5"
          : "rounded-xl border border-slate-200 bg-white shadow-sm"
      }
    >
      <div
        className={
          isPump
            ? "flex items-center justify-between gap-3 bg-gradient-to-r from-indigo-800 via-blue-700 to-slate-800 px-4 py-3.5 text-white shadow-inner"
            : "flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3"
        }
      >
        <div className="flex min-w-0 items-center gap-2.5">
          {icon ? (
            <span
              className={
                isPump
                  ? "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 text-base shadow-sm backdrop-blur-sm"
                  : "inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-xs"
              }
            >
              {icon}
            </span>
          ) : null}
          <div
            className={
              isPump
                ? "text-[15px] font-bold tracking-tight text-white drop-shadow-sm"
                : "text-[15px] font-bold tracking-tight text-slate-800"
            }
          >
            {title}
          </div>
        </div>
        {right ? (
          isPump ? (
            <div className="[&_button]:rounded-lg [&_button]:border-white/35 [&_button]:bg-white/10 [&_button]:text-white [&_button]:hover:bg-white/20">
              {right}
            </div>
          ) : (
            right
          )
        ) : null}
      </div>
      <div
        className={
          isPump
            ? "bg-gradient-to-b from-indigo-50/35 to-white p-4 sm:p-5"
            : "p-4"
        }
      >
        {children}
      </div>
    </section>
  );
}

function ProjectMetaCard({
  value,
  onChange,
}: {
  value: ProjectMeta;
  onChange: (next: ProjectMeta) => void;
}) {
  const row = (label: string, key: keyof ProjectMeta) => (
    <label className="block min-w-0">
      <div className="text-xs font-medium text-zinc-700">{label}</div>
      <input
        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
        value={value[key]}
        onChange={(e) => onChange({ ...value, [key]: e.target.value })}
        type="text"
        autoComplete="off"
      />
    </label>
  );

  return (
    <Card title="Thông tin công trình" icon="📋">
      <div className="grid gap-3 sm:grid-cols-2 font-medium">
        {row("Công trình:", "congTrinh")}
        {row("Địa điểm:", "diaDiem")}
        {row("Chủ đầu tư:", "chuDauTu")}
        {row("Đơn vị tư vấn thiết kế:", "donViTuVanThietKe")}
      </div>
    </Card>
  );
}

function NumberInput({
  value,
  onChange,
  step,
  min,
  variant = "neutral",
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  variant?: "neutral" | "pump";
}) {
  const cls =
    variant === "pump"
      ? "w-full rounded-lg border border-indigo-200/90 bg-white px-3 py-2 text-sm tabular-nums text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25"
      : "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20";
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

function LoadsTable<T extends { name: string; kw: number; quantity: number }>({
  items,
  onChange,
  addLabel,
  variant = "neutral",
}: {
  items: T[];
  onChange: (next: T[]) => void;
  addLabel: string;
  variant?: "neutral" | "pump";
}) {
  const isPump = variant === "pump";
  const wrapBorder = isPump
    ? "overflow-hidden rounded-xl border border-indigo-200/80 shadow-sm"
    : "overflow-hidden rounded-lg border border-slate-200";
  const thead = isPump
    ? "bg-gradient-to-r from-indigo-900 to-blue-800 text-[11px] font-semibold uppercase tracking-wide text-white"
    : "bg-slate-50 text-slate-700";
  const thPad = isPump
    ? "px-3 py-2.5 text-left"
    : "px-3 py-2 text-left font-medium";
  const rowHover = isPump
    ? "border-t border-indigo-100/80 transition hover:bg-violet-50/50"
    : "border-t border-slate-100 hover:bg-slate-50";
  const textInput = isPump
    ? "w-full rounded-lg border border-indigo-200/80 bg-white px-2 py-1.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
    : "w-full rounded-md border border-slate-200 px-2 py-1.5 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20";
  return (
    <div className="space-y-3">
      <div className={wrapBorder}>
        <table className="w-full table-fixed text-sm">
          <colgroup>
            <col className="w-[10%]" />
            <col className="w-[40%]" />
            <col className="w-[30%]" />
            <col className="w-[20%]" />
            <col className="w-11" />
          </colgroup>
          <thead className={thead}>
            <tr>
              <th className={thPad}>STT</th>
              <th className={thPad}>Tên</th>
              <th className={thPad}>Công suất định mức (KW)</th>
              <th className={thPad}>Số lượng</th>
              <th className={thPad}></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className={
                    isPump
                      ? "px-3 py-8 text-center text-sm text-indigo-900/50"
                      : "px-3 py-6 text-center text-zinc-500"
                  }
                >
                  Chưa có thiết bị.
                </td>
              </tr>
            ) : (
              items.map((it, idx) => (
                <tr key={idx} className={rowHover}>
                  <td
                    className={
                      isPump
                        ? "px-4 py-2.5 text-left text-sm font-semibold tabular-nums text-indigo-950/80"
                        : "px-6 py-2 text-left"
                    }
                  >
                    {idx + 1}
                  </td>
                  <td className="min-w-0 px-3 py-2">
                    <input
                      className={textInput}
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
                      variant={variant}
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
                      variant={variant}
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
                      className={
                        isPump
                          ? "rounded-lg border border-indigo-200/80 bg-white px-2 py-1.5 text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-800"
                          : "rounded-md border border-slate-200 px-2 py-1 text-slate-600 hover:bg-rose-50 hover:text-rose-700"
                      }
                      onClick={() =>
                        onChange(items.filter((_, i) => i !== idx))
                      }
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
        className={
          isPump
            ? "inline-flex items-center gap-2 rounded-xl border-2 border-cyan-400/70 bg-gradient-to-r from-cyan-400 to-sky-500 px-4 py-2.5 text-sm font-bold text-indigo-950 shadow-sm shadow-cyan-900/15 transition hover:brightness-105 active:scale-[0.99]"
            : "inline-flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-100"
        }
        onClick={() =>
          onChange([
            ...items,
            {
              name: `${addLabel} ${items.length + 1}`,
              kw: 0,
              quantity: 1,
            } as T,
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
  variant = "neutral",
}: {
  items: BackupPump[];
  onChange: (next: BackupPump[]) => void;
  variant?: "neutral" | "pump";
}) {
  const isPump = variant === "pump";
  const wrapBorder = isPump
    ? "overflow-hidden rounded-xl border border-indigo-200/80 shadow-sm"
    : "overflow-hidden rounded-lg border border-slate-200";
  const thead = isPump
    ? "bg-gradient-to-r from-indigo-900 to-blue-800 text-[11px] font-semibold uppercase tracking-wide text-white"
    : "bg-slate-50 text-slate-700";
  const thPad = isPump
    ? "px-3 py-2.5 text-left"
    : "px-3 py-2 text-left font-medium";
  const rowHover = isPump
    ? "border-t border-indigo-100/80 transition hover:bg-violet-50/50"
    : "border-t border-slate-100 hover:bg-slate-50";
  const textInput = isPump
    ? "w-full rounded-lg border border-indigo-200/80 bg-white px-2 py-1.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
    : "w-full rounded-md border border-slate-200 px-2 py-1.5 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20";
  return (
    <div className="space-y-3">
      <div className={wrapBorder}>
        <table className="w-full table-fixed text-sm">
          <colgroup>
            <col className="w-[10%]" />
            <col className="w-[40%]" />
            <col className="w-[30%]" />
            <col className="w-[20%]" />
            <col className="w-11" />
          </colgroup>
          <thead className={thead}>
            <tr>
              <th className={thPad}>STT</th>
              <th className={thPad}>Tên bơm</th>
              <th className={thPad}>Công suất định mức (KW)</th>
              <th className={thPad}>Số lượng</th>
              <th className={thPad}></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className={
                    isPump
                      ? "px-3 py-8 text-center text-sm text-indigo-900/50"
                      : "px-3 py-6 text-center text-zinc-500"
                  }
                >
                  Chưa có bơm dự phòng.
                </td>
              </tr>
            ) : (
              items.map((it, idx) => (
                <tr key={idx} className={rowHover}>
                  <td
                    className={
                      isPump
                        ? "px-4 py-2.5 text-left text-sm font-semibold tabular-nums text-indigo-950/80"
                        : "px-6 py-2 text-left"
                    }
                  >
                    {idx + 1}
                  </td>
                  <td className="min-w-0 px-3 py-2">
                    <input
                      className={textInput}
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
                      variant={variant}
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
                      variant={variant}
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
                      className={
                        isPump
                          ? "rounded-lg border border-indigo-200/80 bg-white px-2 py-1.5 text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-800"
                          : "rounded-md border border-slate-200 px-2 py-1 text-slate-600 hover:bg-rose-50 hover:text-rose-700"
                      }
                      onClick={() =>
                        onChange(items.filter((_, i) => i !== idx))
                      }
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
        className={
          isPump
            ? "inline-flex items-center gap-2 rounded-xl border-2 border-cyan-400/70 bg-gradient-to-r from-cyan-400 to-sky-500 px-4 py-2.5 text-sm font-bold text-indigo-950 shadow-sm shadow-cyan-900/15 transition hover:brightness-105 active:scale-[0.99]"
            : "inline-flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-100"
        }
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
  const [tab, setTab] = useState<"electric" | "fireBattery">("electric");
  const [projectMeta, setProjectMeta] = useState<ProjectMeta>(() =>
    createDefaultProjectMeta(),
  );
  const [inputs, setInputs] = useState<Inputs>(defaultInputs);
  const [fireBattery, setFireBattery] = useState(
    createDefaultFireBatteryInputs,
  );
  const [fireBatteryResults, setFireBatteryResults] = useState(() =>
    calcFireBattery(createDefaultFireBatteryInputs()),
  );
  const [fireBatteryCalculateError, setFireBatteryCalculateError] = useState<
    string | null
  >(null);
  const [calculateError, setCalculateError] = useState<string | null>(null);
  const [formulaPanelOpen, setFormulaPanelOpen] = useState(true);
  const calculateErrorClearTimer = useRef<number | null>(null);
  const fireBatteryCalculateErrorClearTimer = useRef<number | null>(null);

  function clearFireBatteryCalculateErrorDismissTimer() {
    if (fireBatteryCalculateErrorClearTimer.current !== null) {
      window.clearTimeout(fireBatteryCalculateErrorClearTimer.current);
      fireBatteryCalculateErrorClearTimer.current = null;
    }
  }

  function setTransientFireBatteryCalculateError(message: string) {
    clearFireBatteryCalculateErrorDismissTimer();
    setFireBatteryCalculateError(message);
    fireBatteryCalculateErrorClearTimer.current = window.setTimeout(() => {
      setFireBatteryCalculateError(null);
      fireBatteryCalculateErrorClearTimer.current = null;
    }, 3000);
  }

  function clearCalculateErrorDismissTimer() {
    if (calculateErrorClearTimer.current !== null) {
      window.clearTimeout(calculateErrorClearTimer.current);
      calculateErrorClearTimer.current = null;
    }
  }

  function setTransientCalculateError(message: string) {
    clearCalculateErrorDismissTimer();
    setCalculateError(message);
    calculateErrorClearTimer.current = window.setTimeout(() => {
      setCalculateError(null);
      calculateErrorClearTimer.current = null;
    }, 3000);
  }

  const [results, setResults] = useState(() => calcPcccElectric(defaultInputs));
  const warnings = useMemo(() => validateInputs(inputs), [inputs]);

  useEffect(() => {
    return () => {
      if (calculateErrorClearTimer.current !== null) {
        window.clearTimeout(calculateErrorClearTimer.current);
      }
      if (fireBatteryCalculateErrorClearTimer.current !== null) {
        window.clearTimeout(fireBatteryCalculateErrorClearTimer.current);
      }
    };
  }, []);

  async function exportWord() {
    const res = await fetch("/api/export/word", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        inputs: toAppSavedJson({
          electric: inputs,
          fireBattery,
          projectMeta,
        }),
      }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bang-tinh-tram-bom-pccc.docx";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportWordFire() {
    const res = await fetch("/api/export/word-fire", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        inputs: toAppSavedJson({
          electric: inputs,
          fireBattery,
          projectMeta,
        }),
      }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bang-tinh-bao-chay-tu-dong.docx";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleCalculate() {
    const allPumps = [...inputs.pumpsMain, ...inputs.backupPumps];
    if (allPumps.length === 0) {
      setTransientCalculateError("Vui lòng thêm ít nhất một thiết bị/bơm.");
      return;
    }

    const hasEmptyName = [...inputs.pumpsMain, ...inputs.backupPumps].some(
      (item) => item.name.trim() === "",
    );
    if (hasEmptyName) {
      setTransientCalculateError(
        "Vui lòng nhập đầy đủ tên thiết bị/bơm trước khi tính toán.",
      );
      return;
    }

    clearCalculateErrorDismissTimer();
    setCalculateError(null);
    setResults(calcPcccElectric(inputs));
  }

  function handleCalculateFireBattery() {
    const allRows = [...fireBattery.staticRows, ...fireBattery.alarmRows];
    if (allRows.some((row) => row.name.trim() === "")) {
      setTransientFireBatteryCalculateError(
        "Vui lòng nhập đầy đủ tên thiết bị trước khi tính toán.",
      );
      return;
    }
    clearFireBatteryCalculateErrorDismissTimer();
    setFireBatteryCalculateError(null);
    setFireBatteryResults(calcFireBattery(fireBattery));
  }

  function handleResetFireBattery() {
    clearFireBatteryCalculateErrorDismissTimer();
    const next = createDefaultFireBatteryInputs();
    setFireBattery(next);
    setFireBatteryResults(calcFireBattery(next));
    setFireBatteryCalculateError(null);
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
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-xl border border-slate-200/90 bg-white p-1 font-sans text-sm shadow-sm">
            <button
              className={`rounded-lg px-3 py-2 font-semibold transition ${
                tab === "electric"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/20"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
              onClick={() => setTab("electric")}
              type="button"
            >
              TÍNH CÔNG SUẤT NGUỒN CẤP ĐIỆN CHO TRẠM BƠM PHỤC VỤ CHỮA CHÁY
            </button>
            <button
              className={`rounded-lg px-3 py-2 font-semibold transition ${
                tab === "fireBattery"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/20"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
              onClick={() => setTab("fireBattery")}
              type="button"
            >
              BẢNG TÍNH DÒNG ĐIỆN DUNG LƯỢNG CẤP CHO CHO HỆ THỐNG BÁO CHÁY TỰ
              ĐỘNG
            </button>
          </div>
        </div>

        <div className="mb-6">
          <ProjectMetaCard value={projectMeta} onChange={setProjectMeta} />
        </div>

        {tab === "fireBattery" ? (
          <div className="rounded-2xl border border-indigo-100/80 bg-gradient-to-b from-indigo-50/30 via-white to-slate-50/40 p-4 shadow-sm shadow-indigo-900/5 sm:p-6">
            <FireBatteryTab
              inputs={fireBattery}
              onChange={setFireBattery}
              results={fireBatteryResults}
              onCalculate={handleCalculateFireBattery}
              onReset={handleResetFireBattery}
              onExportWord={exportWordFire}
              calculateError={fireBatteryCalculateError}
            />
          </div>
        ) : (
          <div className="space-y-6 rounded-2xl border border-indigo-100/80 bg-gradient-to-b from-indigo-50/30 via-white to-slate-50/40 p-4 shadow-sm shadow-indigo-900/5 sm:p-6">
            <Card
              variant="pump"
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
                      1) Phụ tải tính toán bơm nước chữa cháy{" "}
                      <KatexFormula
                        display={false}
                        math="P_{tt}"
                        className="!inline"
                      />{" "}
                      (kW)
                    </div>
                    <div className="mb-3 rounded-lg border border-indigo-300/60 bg-white p-3 text-indigo-900">
                      <KatexFormula math="P_{tt} = K_{yc} \displaystyle\sum_{i=1}^{n} P_i" />
                    </div>
                    <ul className="space-y-1 text-sm text-slate-700">
                      <li className="flex flex-wrap items-baseline gap-x-1.5">
                        <span className="text-indigo-600">•</span>
                        <KatexFormula
                          display={false}
                          math="P_i = P_{\text{đm}} \cdot \text{Số lượng}"
                        />
                        <span>
                          (Công suất điện định mức (kW) của bơm thứ i)
                        </span>
                      </li>
                      <li className="flex flex-wrap items-baseline gap-x-1.5">
                        <span className="text-indigo-600">•</span>
                        <KatexFormula display={false} math="K_{yc}" />
                        <span>: Hệ số yêu cầu của phụ tải PCCC</span>
                      </li>
                    </ul>
                  </div>

                  <div className="rounded-xl border border-indigo-200/70 bg-indigo-50/50 px-3 py-2">
                    <div className="font-bold text-indigo-950">
                      2) Công suất biểu kiến máy biến áp{" "}
                      <KatexFormula
                        display={false}
                        math="S_{\mathrm{MBA}}"
                        className="!inline"
                      />{" "}
                      (kVA)
                    </div>
                    <div className="mb-3 rounded-lg border border-indigo-300/60 bg-white p-3 text-indigo-900">
                      <KatexFormula math="S_{\mathrm{MBA}} \geq \dfrac{P_{tt}}{\cos\varphi}" />
                    </div>
                    <ul className="space-y-1 text-sm text-slate-700">
                      <li className="flex flex-wrap items-baseline gap-x-1.5">
                        <span className="text-indigo-600">•</span>
                        <KatexFormula display={false} math="P_{tt}" />
                        <span>: Tổng phụ tải tính toán (kW)</span>
                      </li>
                      <li className="flex flex-wrap items-baseline gap-x-1.5">
                        <span className="text-indigo-600">•</span>
                        <KatexFormula display={false} math="\cos\varphi" />
                        <span>
                          : Hệ số công suất trung bình của lưới điện PCCC
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div className="rounded-xl border border-indigo-200/70 bg-indigo-50/50 px-3 py-2">
                    <div className="font-bold text-indigo-950">
                      3) Công suất máy phát điện dự phòng {" "}
                      <KatexFormula
                        display={false}
                        math="S_{\text{MPĐ}}"
                        className="!inline"
                      />{" "}
                      (A)
                    </div>
                    <div className="mb-3 space-y-3 rounded-lg border border-indigo-300/60 bg-white p-3 text-indigo-900">
                      <KatexFormula math="P_{tt} = K_{yc} \displaystyle\sum_{i=1}^{n} P_i" />
                      <KatexFormula math="P_{kđ} = K_{kđ} \displaystyle\sum_{i=1}^{n} P_i" />
                      <KatexFormula math="S_{\text{MPĐ}} \geq \max(S_{tt},\, S_{k\text{đ}}) \cdot k_{\mathrm{dp}}" />
                      <KatexFormula math="\Leftrightarrow\; S_{\text{MPĐ}} \geq \max\left(\dfrac{P_{tt}}{\cos\varphi},\,\dfrac{P_{k\text{đ}}}{\cos\varphi}\right) \cdot k_{\mathrm{dp}}" />
                    </div>
                    <ul className="space-y-1 text-sm text-slate-700">
                      <li className="flex flex-wrap items-baseline gap-x-1.5">
                        <span className="text-indigo-600">•</span>
                        <KatexFormula
                          display={false}
                          math="S_{tt} = \dfrac{P_{tt}}{\cos\varphi}"
                        />
                      </li>
                      <li className="flex flex-wrap items-baseline gap-x-1.5">
                        <span className="text-indigo-600">•</span>
                        <KatexFormula
                          display={false}
                          math="S_{k\text{đ}} = \dfrac{P_{k\text{đ}}}{\cos\varphi}"
                        />
                      </li>
                      <li className="flex flex-wrap items-baseline gap-x-1.5">
                        <span className="text-indigo-600">•</span>
                        <KatexFormula display={false} math="K_{\mathrm{dp}}" />
                        <span>
                          : Hệ số dự phòng, thường lấy từ 1,1 đến 1,25
                        </span>
                      </li>
                      <li className="flex flex-wrap items-baseline gap-x-1.5">
                        <span className="text-indigo-600">•</span>
                        <KatexFormula display={false} math="\cos\varphi" />
                        <span>
                          : Hệ số công suất trung bình của lưới điện PCCC
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-zinc-600">
                  Đang ẩn phần công thức. Bấm{" "}
                  <span className="font-semibold text-indigo-800">Mở</span> ở
                  góc phải để mở lại.
                </p>
              )}
            </Card>

            <Card
              variant="pump"
              title={
                <span className="inline-flex flex-wrap items-center gap-x-1">
                  Danh mục thiết bị phụ tải
                </span>
              }
              icon="🚒"
            >
              <LoadsTable<NamedLoad>
                variant="pump"
                items={inputs.pumpsMain}
                onChange={(pumpsMain) =>
                  setInputs((s) => ({ ...s, pumpsMain }))
                }
                addLabel="Thiết bị"
              />
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card
                variant="pump"
                title="Bơm chữa cháy điện dự phòng"
                icon="⚙️"
              >
                <BackupTable
                  variant="pump"
                  items={inputs.backupPumps}
                  onChange={(backupPumps) =>
                    setInputs((s) => ({ ...s, backupPumps }))
                  }
                />
              </Card>

              <Card variant="pump" title="Tham số chung" icon="🔧">
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <div className="text-xs font-semibold text-indigo-900/85">
                      K<sub>yc</sub>
                    </div>
                    <NumberInput
                      variant="pump"
                      value={inputs.kyc}
                      step={0.01}
                      min={0}
                      onChange={(kyc) => setInputs((s) => ({ ...s, kyc }))}
                    />
                    <div className="mt-1 text-[11px] text-zinc-500">
                      Hệ số yêu cầu phụ tải
                    </div>
                  </label>
                  <label className="block">
                    <div className="text-xs font-semibold text-indigo-900/85">
                      K<sub>kđ</sub>
                    </div>
                    <NumberInput
                      variant="pump"
                      value={inputs.kkD}
                      step={0.01}
                      min={0}
                      onChange={(kkD) => setInputs((s) => ({ ...s, kkD }))}
                    />
                    <div className="mt-1 text-[11px] text-zinc-500">
                      Hệ số khởi động
                    </div>
                  </label>
                  <label className="block">
                    <div className="text-xs font-semibold text-indigo-900/85">
                      cosφ
                    </div>
                    <NumberInput
                      variant="pump"
                      value={inputs.cosPhi}
                      step={0.01}
                      min={0}
                      onChange={(cosPhi) =>
                        setInputs((s) => ({ ...s, cosPhi }))
                      }
                    />
                    <div className="mt-1 text-[11px] text-zinc-500">
                      Khuyến nghị: 0.80–0.85
                    </div>
                  </label>
                  <label className="block">
                    <div className="text-xs font-semibold text-indigo-900/85">
                      K<sub>dp</sub>
                    </div>
                    <NumberInput
                      variant="pump"
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
                  <div className="mt-4 rounded-xl border border-indigo-300/60 bg-gradient-to-r from-indigo-50/90 to-cyan-50/40 px-3 py-2 text-sm text-indigo-950 shadow-sm">
                    <div className="font-bold text-indigo-900">Lưu ý</div>
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
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-900/20 transition hover:brightness-105 active:scale-[0.99]"
                    onClick={handleCalculate}
                  >
                    ⚡ Tính toán
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border-2 border-rose-300/90 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-800 shadow-sm transition hover:bg-rose-100 active:scale-[0.99]"
                    onClick={() => {
                      clearCalculateErrorDismissTimer();
                      setInputs(resetInputs);
                      setResults(calcPcccElectric(resetInputs));
                      setCalculateError(null);
                    }}
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border-2 border-indigo-200 bg-white px-4 py-2.5 text-sm font-bold text-indigo-900 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50/60 active:scale-[0.99]"
                    onClick={exportWord}
                  >
                    Xuất Word
                  </button>
                </div>
                {calculateError ? (
                  <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                    {calculateError}
                  </div>
                ) : null}
              </Card>
            </div>

            <Card variant="pump" title="Kết quả tính toán" icon="✅">
              <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-xl border border-indigo-200/80 bg-gradient-to-br from-white to-indigo-50/40 px-4 py-3 shadow-sm shadow-indigo-900/5 lg:col-span-2">
                  <div className="flex flex-wrap items-baseline gap-x-1 text-xs font-semibold text-indigo-800/75">
                    <KatexFormula
                      display={false}
                      math="P_{tt}"
                      className="!inline"
                    />
                    <span>– Công suất phụ tải bơm nước chữa cháy</span>
                  </div>
                  <div className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-indigo-950">
                    {formatCalcNumber(results.ptt)}{" "}
                    <span className="text-base font-semibold text-indigo-800">
                      kW
                    </span>
                  </div>
                </div>
                <div className="rounded-xl border border-indigo-200/80 bg-gradient-to-br from-white to-indigo-50/40 px-4 py-3 shadow-sm shadow-indigo-900/5 lg:col-span-2">
                  <div className="flex flex-wrap items-baseline gap-x-1 text-xs font-semibold text-indigo-800/75">
                    <KatexFormula
                      display={false}
                      math="S_{\mathrm{MBA}}"
                      className="!inline"
                    />
                    <span>– Công suất biểu kiến máy biến áp</span>
                  </div>
                  <div className="text-2xl font-bold tabular-nums tracking-tight text-indigo-950">
                    {formatCalcNumber(results.smba)}{" "}
                    <span className="text-base font-semibold text-indigo-800">
                      kVA
                    </span>
                  </div>
                  {results.smba === 0 ? (
                    <div className="mt-3 rounded-xl border border-indigo-200/70 bg-indigo-50/50 px-3 py-2 text-sm text-indigo-900/85">
                      Để tính công suất biểu kiến máy áp, hãy thêm thiết bị phụ
                      tải.
                    </div>
                  ) : (
                    <p className="mt-3 border-t border-indigo-100 pt-3 text-sm leading-relaxed text-indigo-950/90">
                      <span className="font-bold text-indigo-900">
                        Kết luận:
                      </span>{" "}
                      Để đảm bảo yêu cầu theo quy định, công trình phải sử dụng
                      máy biến áp có công suất tối thiểu là{" "}
                      <span className="font-bold tabular-nums text-indigo-800">
                        {formatCalcNumber(results.smba)} kVA
                      </span>
                      .
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-cyan-200/90 bg-gradient-to-br from-cyan-50/45 via-white to-white px-4 py-3 shadow-sm shadow-cyan-900/10 ring-1 ring-cyan-200/40 lg:col-span-2">
                  <div className="text-sm font-extrabold uppercase tracking-wide text-indigo-950">
                    Công suất máy phát điện dự phòng cho bơm chữa cháy
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-indigo-950/90">
                    <div className="flex items-center justify-between">
                      <KatexFormula display={false} math="P_{tt}" />
                      <span className="font-mono">
                        {formatCalcNumber(results.pttBackup)} kW
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <KatexFormula display={false} math="P_{k\text{đ}}" />
                      <span className="font-mono">
                        {formatCalcNumber(results.pkd)} kW
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <KatexFormula display={false} math="S_{tt}" />
                      <span className="font-mono">
                        {formatCalcNumber(results.stt)} kVA
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <KatexFormula display={false} math="S_{k\text{đ}}" />
                      <span className="font-mono">
                        {formatCalcNumber(results.skd)} kVA
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-cyan-200/60 pt-2">
                      <span className="inline-flex items-baseline gap-x-1 font-semibold text-cyan-900">
                        <KatexFormula
                          display={false}
                          math="S_{\text{MPĐ}}"
                          className="!inline"
                        />
                        <span>tối thiểu</span>
                      </span>
                      <span className="font-mono text-base font-bold tabular-nums text-indigo-950">
                        {formatCalcNumber(results.smpd)} kVA
                      </span>
                    </div>
                  </div>

                  {results.smpd === 0 ? (
                    <div className="mt-3 rounded-xl border border-indigo-200/70 bg-indigo-50/50 px-3 py-2 text-sm text-indigo-900/85">
                      Để tính máy phát điện, hãy thêm bơm dự phòng.
                    </div>
                  ) : (
                    <p className="mt-3 border-t border-indigo-100 pt-3 text-sm leading-relaxed text-indigo-950/90">
                      <span className="font-bold text-indigo-900">
                        Kết luận:
                      </span>{" "}
                      Để đảm bảo theo quy định, máy phát điện dự phòng phải có
                      công suất tối thiểu{" "}
                      <span className="font-bold tabular-nums text-indigo-800">
                        {formatCalcNumber(results.smpd)} kVA
                      </span>
                      .
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
