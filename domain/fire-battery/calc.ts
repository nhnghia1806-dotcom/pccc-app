import type { FireBatteryInputs, FireBatteryResults, FireBatteryRow } from "./models";

function rowTotal(r: FireBatteryRow): number {
  const q = Number.isFinite(r.quantity) ? Math.max(0, r.quantity) : 0;
  const m = Number.isFinite(r.mAEach) ? Math.max(0, r.mAEach) : 0;
  return q * m;
}

export function calcFireBattery(inputs: FireBatteryInputs): FireBatteryResults {
  const staticRows = inputs.staticRows.map((r) => {
    const name = typeof r.name === "string" ? r.name : "";
    const totalMA = rowTotal({ ...r, name });
    return { ...r, name, totalMA };
  });

  const alarmRows = inputs.alarmRows.map((r) => {
    const name = typeof r.name === "string" ? r.name : "";
    const totalMA = rowTotal({ ...r, name });
    return { ...r, name, totalMA };
  });

  const totalStaticMA = staticRows.reduce((a, x) => a + x.totalMA, 0);
  const totalAlarmMA = alarmRows.reduce((a, x) => a + x.totalMA, 0);

  const iqA = totalStaticMA / 1000;
  const iaA = totalAlarmMA / 1000;

  const tq = Number.isFinite(inputs.tqHours) ? Math.max(0, inputs.tqHours) : 24;
  const ta = Number.isFinite(inputs.taHours) ? Math.max(0, inputs.taHours) : 0.5;
  const fc = Number.isFinite(inputs.fc) ? Math.max(0, inputs.fc) : 1;

  const c20RequiredAh = 1.25 * (iqA * tq + fc * (iaA * ta));

  const icA = (1.25 * (iqA * 5 + iaA * 0.5)) / 24;

  const ipseA = iqA + icA;

  const rated = Number.isFinite(inputs.ratedC20Ah) ? inputs.ratedC20Ah : 0;
  const batteryOk = rated > 0 ? rated + 1e-9 >= c20RequiredAh : null;

  return {
    staticRows,
    alarmRows,
    totalStaticMA,
    totalAlarmMA,
    iqA,
    iaA,
    c20RequiredAh,
    icA,
    ipseA,
    batteryOk,
  };
}
