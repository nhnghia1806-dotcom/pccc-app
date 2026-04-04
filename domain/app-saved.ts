import type { Inputs } from "./pccc-electric/models";
import { normalizeElectricInputs } from "./pccc-electric/normalize-electric";
import { createDefaultFireBatteryInputs, normalizeFireBatteryInputs } from "./fire-battery/defaults";
import type { FireBatteryInputs } from "./fire-battery/models";

export type ProjectMeta = {
  congTrinh: string;
  diaDiem: string;
  chuDauTu: string;
  donViTuVanThietKe: string;
};

export function createDefaultProjectMeta(): ProjectMeta {
  return {
    congTrinh: "",
    diaDiem: "",
    chuDauTu: "",
    donViTuVanThietKe: "",
  };
}

function normalizeProjectMeta(raw: unknown): ProjectMeta {
  if (!raw || typeof raw !== "object") return createDefaultProjectMeta();
  const o = raw as Record<string, unknown>;
  const s = (v: unknown) => (typeof v === "string" ? v : "");
  return {
    congTrinh: s(o.congTrinh),
    diaDiem: s(o.diaDiem),
    chuDauTu: s(o.chuDauTu),
    donViTuVanThietKe: s(o.donViTuVanThietKe),
  };
}

/** JSON lưu server: điện PCCC + kiểm tra ắc quy. */
export type AppSavedJson = {
  electric: Inputs;
  fireBattery: FireBatteryInputs;
  projectMeta: ProjectMeta;
};

export function parseAppSavedJson(raw: unknown): AppSavedJson | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;

  if ("electric" in o && o.electric && typeof o.electric === "object") {
    return {
      electric: normalizeElectricInputs(o.electric as Inputs),
      fireBattery: normalizeFireBatteryInputs(o.fireBattery),
      projectMeta: normalizeProjectMeta(o.projectMeta),
    };
  }

  if ("kdt" in o || "pumpsMain" in o) {
    return {
      electric: normalizeElectricInputs(o as Inputs),
      fireBattery: createDefaultFireBatteryInputs(),
      projectMeta: normalizeProjectMeta(o.projectMeta),
    };
  }

  return null;
}

export function toAppSavedJson(payload: AppSavedJson): AppSavedJson {
  return {
    electric: payload.electric,
    fireBattery: payload.fireBattery,
    projectMeta: normalizeProjectMeta(payload.projectMeta),
  };
}
