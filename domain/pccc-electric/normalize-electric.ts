import type { Inputs } from "./models";

const electricDefaults: Inputs = {
  kdt: 1,
  kyc: 1,
  kkD: 1.3,
  cosPhi: 0.8,
  kdp: 1.2,
  pumpsMain: [],
  otherLoads: [],
  backupPumps: [],
};

/** Gộp dữ liệu điện PCCC đã lưu với mặc định (migration kkD từng dòng cũ). */
export function normalizeElectricInputs(raw: Partial<Inputs> & Record<string, unknown>): Inputs {
  const legacyKkD =
    typeof raw.kkD === "number" && Number.isFinite(raw.kkD)
      ? raw.kkD
      : (() => {
          const first = raw.backupPumps?.[0] as { kkD?: number } | undefined;
          return typeof first?.kkD === "number" && Number.isFinite(first.kkD)
            ? first.kkD
            : electricDefaults.kkD;
        })();

  return {
    ...electricDefaults,
    ...raw,
    kkD: legacyKkD,
    pumpsMain: (raw.pumpsMain ?? []).map((x) => ({
      ...x,
      quantity:
        typeof x.quantity === "number" && Number.isFinite(x.quantity) ? x.quantity : 1,
    })),
    otherLoads: (raw.otherLoads ?? []).map((x) => ({
      ...x,
      quantity:
        typeof x.quantity === "number" && Number.isFinite(x.quantity) ? x.quantity : 1,
    })),
    backupPumps: (raw.backupPumps ?? []).map((x) => ({
      name: typeof x.name === "string" ? x.name : "",
      kw: typeof x.kw === "number" && Number.isFinite(x.kw) ? x.kw : 0,
      quantity:
        typeof x.quantity === "number" && Number.isFinite(x.quantity) ? x.quantity : 1,
    })),
  };
}
