import type { Inputs, Results } from "./models";

function sumKw(items: { kw: number; quantity?: number }[]) {
  return items.reduce((acc, x) => {
    const kw = Number.isFinite(x.kw) ? x.kw : 0;
    const quantity = Number.isFinite(x.quantity) ? Number(x.quantity) : 1;
    return acc + kw * Math.max(0, quantity);
  }, 0);
}

function safeDiv(a: number, b: number) {
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return 0;
  return a / b;
}

export function calcPcccElectric(inputs: Inputs): Results {
  const kyc = Number.isFinite(inputs.kyc) ? inputs.kyc : 1;
  const kdt = Number.isFinite(inputs.kdt) ? inputs.kdt : 1;
  const kkD = Number.isFinite(inputs.kkD) ? inputs.kkD : 1.3;
  const cosPhi = Number.isFinite(inputs.cosPhi) ? inputs.cosPhi : 0.8;
  const kdp = Number.isFinite(inputs.kdp) ? inputs.kdp : 1.2;

  const pb = kyc * sumKw(inputs.pumpsMain);
  const pkhac = kyc * sumKw(inputs.otherLoads);
  const pBackup = kyc * sumKw(inputs.backupPumps);
  /** Ptt tổng cho MBA — không gồm bơm dự phòng */
  const ptt = kdt * (pb * kkD + pkhac);
  /** Ptt riêng nhóm bơm DP — khác `ptt` */
  const pttBackup = kdt * pBackup;

  const smba = safeDiv(ptt, cosPhi);

  const pkd = kkD * sumKw(inputs.backupPumps);

  /** S_tt (máy phát) = P_tt nhóm bơm dự phòng / cosφ — không dùng P_tt MBA */
  const stt = safeDiv(pttBackup, cosPhi);
  const skd = safeDiv(pkd, cosPhi);
  const smpd = Math.max(stt, skd) * kdp;

  return {
    pb,
    pkhac,
    pttBackup,
    ptt,
    smba,
    pkd,
    stt,
    skd,
    smpd,
  };
}

