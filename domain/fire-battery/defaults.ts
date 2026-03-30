import { ALARM_DEVICE_NAMES, STATIC_DEVICE_NAMES } from "./constants";
import type { FireBatteryInputs, FireBatteryRow } from "./models";

function normalizeFireBatteryRow(
  raw: unknown,
  index: number,
  legacyNames: readonly string[],
): FireBatteryRow {
  const o = raw as Partial<FireBatteryRow>;
  const quantity =
    typeof o.quantity === "number" && Number.isFinite(o.quantity) ? o.quantity : 0;
  const mAEach = typeof o.mAEach === "number" && Number.isFinite(o.mAEach) ? o.mAEach : 0;
  const nameFromData = typeof o.name === "string" ? o.name.trim() : "";
  const name =
    nameFromData !== ""
      ? nameFromData
      : (legacyNames[index] ?? `Thiết bị ${index + 1}`);
  return { name, quantity, mAEach };
}

export function createDefaultFireBatteryInputs(): FireBatteryInputs {
  return {
    staticRows: [],
    alarmRows: [],
    tqHours: 24,
    taHours: 0.5,
    fc: 2,
    ratedC20Ah: 0,
  };
}

export function normalizeFireBatteryInputs(raw: unknown): FireBatteryInputs {
  if (!raw || typeof raw !== "object") return createDefaultFireBatteryInputs();
  const o = raw as Partial<FireBatteryInputs>;

  const staticRows = Array.isArray(o.staticRows)
    ? o.staticRows.map((r, i) => normalizeFireBatteryRow(r, i, STATIC_DEVICE_NAMES))
    : [];
  const alarmRows = Array.isArray(o.alarmRows)
    ? o.alarmRows.map((r, i) => normalizeFireBatteryRow(r, i, ALARM_DEVICE_NAMES))
    : [];

  return {
    staticRows,
    alarmRows,
    tqHours:
      typeof o.tqHours === "number" && Number.isFinite(o.tqHours) ? o.tqHours : 24,
    taHours:
      typeof o.taHours === "number" && Number.isFinite(o.taHours) ? o.taHours : 0.5,
    fc: typeof o.fc === "number" && Number.isFinite(o.fc) ? o.fc : 1,
    ratedC20Ah:
      typeof o.ratedC20Ah === "number" && Number.isFinite(o.ratedC20Ah)
        ? o.ratedC20Ah
        : 0,
  };
}
