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
  const kkD = Number.isFinite(inputs.kkD) ? inputs.kkD : 1;
  const cosPhi = Number.isFinite(inputs.cosPhi) ? inputs.cosPhi : 0.8;
  const kdp = Number.isFinite(inputs.kdp) ? inputs.kdp : 1.2;

  const sumPi = sumKw(inputs.pumpsMain);
  const pBackup = kyc * sumKw(inputs.backupPumps);
  /** P_tt = K_yc · Σ P_i — không gồm bơm dự phòng */
  const ptt = kyc * sumPi;
  /** P_tt nhóm bơm DP: Kyc · Σ P_i — khác `ptt` (MBA) */
  const pttBackup = pBackup;

  const smba = safeDiv(ptt, cosPhi);

  const pkd = kkD * sumKw(inputs.backupPumps);

  /** S_tt (máy phát) = P_tt nhóm bơm dự phòng / cosφ — không dùng P_tt MBA */
  const stt = safeDiv(pttBackup, cosPhi);
  const skd = safeDiv(pkd, cosPhi);
  const smpd = Math.max(stt, skd) * kdp;

  return {
    sumPi,
    pttBackup,
    ptt,
    smba,
    pkd,
    stt,
    skd,
    smpd,
  };
}

