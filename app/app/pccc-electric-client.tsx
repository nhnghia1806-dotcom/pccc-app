"use client";

import { signOut } from "next-auth/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { parseAppSavedJson, toAppSavedJson } from "@/domain/app-saved";
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
import PcccImageStrip from "./pccc-image-strip";

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
              <th className="px-3 py-2 text-left font-medium">
                Công suất định mức (KW)
              </th>
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
                <tr
                  key={idx}
                  className="border-t border-slate-100 hover:bg-slate-50"
                >
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
        className="inline-flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-100"
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
              <th className="px-3 py-2 text-left font-medium">
                Công suất định mức (KW)
              </th>
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
                <tr
                  key={idx}
                  className="border-t border-slate-100 hover:bg-slate-50"
                >
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
  const [tab, setTab] = useState<"electric" | "fireBattery">("electric");
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
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "loading" | "saved" | "error"
  >("idle");
  const [calculateError, setCalculateError] = useState<string | null>(null);
  const [formulaPanelOpen, setFormulaPanelOpen] = useState(true);
  const saveTimer = useRef<number | null>(null);
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
    let alive = true;
    (async () => {
      setSaveStatus("loading");
      try {
        const res = await fetch("/api/state");
        if (!res.ok) throw new Error("load_failed");
        const j = (await res.json()) as { inputs?: unknown };
        if (alive && j.inputs) {
          const parsed = parseAppSavedJson(j.inputs);
          if (parsed) {
            setInputs(parsed.electric);
            setFireBattery(parsed.fireBattery);
            setFireBatteryResults(calcFireBattery(parsed.fireBattery));
            clearFireBatteryCalculateErrorDismissTimer();
            setFireBatteryCalculateError(null);
          }
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
          body: JSON.stringify({
            inputs: toAppSavedJson({ electric: inputs, fireBattery }),
          }),
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
  }, [inputs, fireBattery]);

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
    const allPumps = [...inputs.pumpsMain, ...inputs.backupPumps];
    if (allPumps.length === 0) {
      setTransientCalculateError(
        "Vui lòng thêm ít nhất một thiết bị/bơm.",
      );
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
        <PcccImageStrip />

        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 font-sans text-sm">
            <button
              className={`rounded-md px-3 py-2 font-semibold ${tab === "electric" ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-50"}`}
              onClick={() => setTab("electric")}
              type="button"
            >
              BẢNG TÍNH NGUỒN CẤP ĐIỆN CHO TRẠM BƠM PHỤC VỤ CHỮA CHÁY
            </button>
            <button
              className={`rounded-md px-3 py-2 font-semibold ${tab === "fireBattery" ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-50"}`}
              onClick={() => setTab("fireBattery")}
              type="button"
            >
              BẢNG TÍNH NGUỒN CẤP ĐIỆN CHO HỆ THỐNG BÁO CHÁY TỰ ĐỘNG
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

        {tab === "fireBattery" ? (
          <FireBatteryTab
            inputs={fireBattery}
            onChange={setFireBattery}
            results={fireBatteryResults}
            onCalculate={handleCalculateFireBattery}
            onReset={handleResetFireBattery}
            calculateError={fireBatteryCalculateError}
          />
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
                    <div className="font-bold">
                      1) Phụ tải tính toán bơm nước chữa cháy
                    </div>
                    <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-800">
                      <KatexFormula math="P_{tt} = K_{yc} \displaystyle\sum_{i=1}^{n} P_i" />
                    </div>
                    <ul className="space-y-1 text-sm text-slate-700">
                      <li className="flex flex-wrap items-baseline gap-x-1.5">
                        <span>•</span>
                        <KatexFormula
                          display={false}
                          math="P_i = P_{\text{đm}} \cdot \text{Số lượng}"
                        />
                        <span>(Công suất điện định mức của bơm thứ i)</span>
                      </li>
                      <li className="flex flex-wrap items-baseline gap-x-1.5">
                        <span>•</span>
                        <KatexFormula display={false} math="K_{yc}" />
                        <span>: Hệ số yêu cầu của phụ tải PCCC</span>
                      </li>
                    </ul>
                  </div>

                  <div className="rounded-lg border border-sky-100 bg-sky-50/60 px-3 py-2">
                    <div className="font-bold">
                      2) Công suất biểu kiến máy biến áp
                    </div>
                    <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-800">
                      <KatexFormula math="S_{\mathrm{MBA}} \geq \dfrac{P_{tt}}{\cos\varphi}" />
                    </div>
                    <ul className="space-y-1 text-sm text-slate-700">
                      <li className="flex flex-wrap items-baseline gap-x-1.5">
                        <span>•</span>
                        <KatexFormula display={false} math="P_{tt}" />
                        <span>: Tổng phụ tải tính toán</span>
                      </li>
                      <li className="flex flex-wrap items-baseline gap-x-1.5">
                        <span>•</span>
                        <KatexFormula display={false} math="\cos\varphi" />
                        <span>
                          : Hệ số công suất trung bình của lưới điện PCCC
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div className="rounded-lg border border-sky-100 bg-sky-50/60 px-3 py-2">
                    <div className="font-bold">
                      3) Công suất máy phát điện dự phòng (khi sử dụng bơm chữa
                      cháy dự phòng điện)
                    </div>
                    <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-800">
                      <KatexFormula math="S_{\text{MPĐ}} \geq \max(S_{tt},\, S_{k\text{đ}}) \cdot k_{\mathrm{dp}}" />
                    </div>
                    <ul className="space-y-1 text-sm text-slate-700">
                      <li className="flex flex-wrap items-baseline gap-x-1.5">
                        <span>•</span>
                        <KatexFormula
                          display={false}
                          math="P_{tt} = K_{yc} \displaystyle\sum_{i=1}^{n} P_i"
                        />
                      </li>
                      <li className="flex flex-wrap items-baseline gap-x-1.5">
                        <span>•</span>
                        <KatexFormula
                          display={false}
                          math="S_{tt} = \dfrac{P_{tt}}{\cos\varphi}"
                        />
                      </li>
                      <li className="flex flex-wrap items-baseline gap-x-1.5">
                        <span>•</span>
                        <KatexFormula
                          display={false}
                          math="P_{kđ} = K_{kđ} \displaystyle\sum_{i=1}^{n} P_i"
                        />
                      </li>
                      <li className="flex flex-wrap items-baseline gap-x-1.5">
                        <span>•</span>
                        <KatexFormula
                          display={false}
                          math="S_{k\text{đ}} = \dfrac{P_{k\text{đ}}}{\cos\varphi}"
                        />
                      </li>
                      <li className="flex flex-wrap items-baseline gap-x-1.5">
                        <span>•</span>
                        <KatexFormula display={false} math="K_{\mathrm{dp}}" />
                        <span>
                          : Hệ số dự phòng, thường lấy từ 1,1 đến 1,25
                        </span>
                      </li>
                      <li className="flex flex-wrap items-baseline gap-x-1.5">
                        <span>•</span>
                        <KatexFormula display={false} math="\cos\varphi" />
                        <span>
                          : Hệ số công suất trung bình của lưới điện PCCC
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-zinc-500">
                  Đang ẩn phần công thức. Bấm{" "}
                  <span className="font-medium text-slate-700">Mở</span> ở góc
                  phải để mở lại.
                </p>
              )}
            </Card>

            <Card
              title={
                <span className="inline-flex flex-wrap items-center gap-x-1">
                  Danh mục thiết bị phụ tải
                </span>
              }
              icon="🚒"
            >
              <LoadsTable<NamedLoad>
                items={inputs.pumpsMain}
                onChange={(pumpsMain) =>
                  setInputs((s) => ({ ...s, pumpsMain }))
                }
                addLabel="Thiết bị"
              />
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card title="Bơm chữa cháy điện dự phòng" icon="⚙️">
                <BackupTable
                  items={inputs.backupPumps}
                  onChange={(backupPumps) =>
                    setInputs((s) => ({ ...s, backupPumps }))
                  }
                />
              </Card>

              <Card title="Tham số chung" icon="🔧">
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <div className="text-xs font-medium text-zinc-700">
                      K<sub>yc</sub>
                    </div>
                    <NumberInput
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
                    <div className="text-xs font-medium text-zinc-700">
                      K<sub>kđ</sub>
                    </div>
                    <NumberInput
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
                    <div className="text-xs font-medium text-zinc-700">
                      cosφ
                    </div>
                    <NumberInput
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
                    <div className="text-xs font-medium text-zinc-700">
                      K<sub>dp</sub>
                    </div>
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
                <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 lg:col-span-2">
                  <div className="flex flex-wrap items-baseline gap-x-1 text-xs text-zinc-500">
                    <KatexFormula
                      display={false}
                      math="P_{tt}"
                      className="!inline"
                    />
                    <span>– Công suất phụ tải bơm nước chữa cháy</span>
                  </div>
                  <div className="mt-1 text-2xl font-semibold tracking-tight">
                    {formatCalcNumber(results.ptt)}{" "}
                    <span className="text-base font-medium">kW</span>
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 lg:col-span-2">
                  <div className="flex flex-wrap items-baseline gap-x-1 text-xs text-zinc-500">
                    <KatexFormula
                      display={false}
                      math="S_{\mathrm{MBA}}"
                      className="!inline"
                    />
                    <span>– Công suất biểu kiến máy biến áp</span>
                  </div>
                  <div className="text-2xl font-semibold tracking-tight">
                    {formatCalcNumber(results.smba)}{" "}
                    <span className="text-base font-medium">kVA</span>
                  </div>
                  {results.smba === 0 ? (
                    <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
                      Để tính công suất biểu kiến máy áp, hãy thêm thiết bị phụ
                      tải.
                    </div>
                  ) : (
                    <p className="mt-3 border-t border-slate-100 pt-3 text-sm leading-relaxed text-slate-800">
                      <span className="font-semibold text-slate-900">
                        Kết luận:
                      </span>{" "}
                      Để đảm bảo yêu cầu theo quy định, công trình phải sử dụng
                      máy biến áp có công suất tối thiểu là{" "}
                      <span className="font-semibold tabular-nums text-blue-800">
                        {formatCalcNumber(results.smba)} kVA
                      </span>
                      .
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 lg:col-span-2">
                  <div className="text-sm font-bold tracking-tight">
                    Công suất máy phát điện dự phòng cho bơm chữa cháy
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-zinc-700">
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
                    <div className="flex items-center justify-between border-t pt-2">
                      <span className="inline-flex items-baseline gap-x-1 font-medium">
                        <KatexFormula
                          display={false}
                          math="S_{\text{MPĐ}}"
                          className="!inline"
                        />
                        <span>tối thiểu</span>
                      </span>
                      <span className="font-mono font-semibold">
                        {formatCalcNumber(results.smpd)} kVA
                      </span>
                    </div>
                  </div>

                  {results.smpd === 0 ? (
                    <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
                      Để tính máy phát điện, hãy thêm bơm dự phòng.
                    </div>
                  ) : (
                    <p className="mt-3 border-t border-slate-100 pt-3 text-sm leading-relaxed text-slate-800">
                      <span className="font-semibold text-slate-900">
                        Kết luận:
                      </span>{" "}
                      Để đảm bảo theo quy định, máy phát điện dự phòng phải có
                      công suất tối thiểu{" "}
                      <span className="font-semibold tabular-nums text-blue-800">
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
