import type { Inputs } from "./pccc-electric/models";
import { normalizeElectricInputs } from "./pccc-electric/normalize-electric";
import { createDefaultFireBatteryInputs, normalizeFireBatteryInputs } from "./fire-battery/defaults";
import type { FireBatteryInputs } from "./fire-battery/models";

/** JSON lưu server: điện PCCC + kiểm tra ắc quy. */
export type AppSavedJson = {
  electric: Inputs;
  fireBattery: FireBatteryInputs;
};

export function parseAppSavedJson(raw: unknown): AppSavedJson | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;

  if ("electric" in o && o.electric && typeof o.electric === "object") {
    return {
      electric: normalizeElectricInputs(o.electric as Inputs),
      fireBattery: normalizeFireBatteryInputs(o.fireBattery),
    };
  }

  if ("kdt" in o || "pumpsMain" in o) {
    return {
      electric: normalizeElectricInputs(o as Inputs),
      fireBattery: createDefaultFireBatteryInputs(),
    };
  }

  return null;
}

export function toAppSavedJson(payload: AppSavedJson): AppSavedJson {
  return {
    electric: payload.electric,
    fireBattery: payload.fireBattery,
  };
}
