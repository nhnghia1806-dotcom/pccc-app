import type { Inputs } from "./models";

const electricDefaults: Inputs = {
  kyc: 1,
  kkD: 1,
  cosPhi: 0.8,
  kdp: 1.2,
  pumpsMain: [],
  backupPumps: [],
};

function num(raw: Partial<Inputs>, key: keyof Inputs, fallback: number): number {
  const v = raw[key];
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

/** Gộp dữ liệu điện PCCC đã lưu với mặc định (migration kkD từng dòng cũ). Bỏ otherLoads / kdt cũ nếu có trong JSON. */
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
    kyc: num(raw, "kyc", electricDefaults.kyc),
    kkD: legacyKkD,
    cosPhi: num(raw, "cosPhi", electricDefaults.cosPhi),
    kdp: num(raw, "kdp", electricDefaults.kdp),
    pumpsMain: (raw.pumpsMain ?? []).map((x) => ({
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
