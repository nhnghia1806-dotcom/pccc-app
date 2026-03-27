import type { Inputs, Results } from "./models";

function sumKw(items: { kw: number; quantity?: number }[]) {
  return items.reduce((acc, x) => {
    const kw = Number.isFinite(x.kw) ? x.kw : 0;
    const quantity = Number.isFinite(x.quantity) ? Number(x.quantity) : 1;
    return acc + kw * Math.max(0, quantity);
  }, 0);
}

function round1(x: number) {
  return Math.round(x * 10) / 10;
}

function safeDiv(a: number, b: number) {
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return 0;
  return a / b;
}

export function calcPcccElectric(inputs: Inputs): Results {
  const kyc = Number.isFinite(inputs.kyc) ? inputs.kyc : 1;
  const kdt = Number.isFinite(inputs.kdt) ? inputs.kdt : 1;
  const cosPhi = Number.isFinite(inputs.cosPhi) ? inputs.cosPhi : 0.8;
  const kdp = Number.isFinite(inputs.kdp) ? inputs.kdp : 1.2;

  const pb = kyc * sumKw(inputs.pumpsMain);
  const pkhac = kyc * sumKw(inputs.otherLoads);
  const ptt = kdt * (pb + pkhac);

  const smba = safeDiv(ptt, cosPhi);

  const pkd = inputs.backupPumps.reduce((acc, p) => {
    const kw = Number.isFinite(p.kw) ? p.kw : 0;
    const kkD = Number.isFinite(p.kkD) ? p.kkD : 1;
    return acc + kw * kkD;
  }, 0);

  const stt = safeDiv(ptt, cosPhi);
  const skd = safeDiv(pkd, cosPhi);
  const smpd = Math.max(stt, skd) * kdp;

  return {
    pb: round1(pb),
    pkhac: round1(pkhac),
    ptt: round1(ptt),
    smba: round1(smba),
    pkd: round1(pkd),
    stt: round1(stt),
    skd: round1(skd),
    smpd: round1(smpd),
  };
}

