export type FireBatteryRow = {
  name: string;
  quantity: number;
  /** Dòng tiêu thụ mỗi thiết bị (mA) */
  mAEach: number;
};

export type FireBatteryInputs = {
  staticRows: FireBatteryRow[];
  alarmRows: FireBatteryRow[];
  /** T_Q — thời gian dự phòng tải tĩnh (h), thường 24 */
  tqHours: number;
  /** T_A — thời gian dự phòng toàn tải báo cháy (h), thường 0,5 */
  taHours: number;
  /** F_C — hệ số giảm dung lượng ắc quy ở I_A */
  fc: number;
  /** Dung lượng ắc quy lắp đặt C20 (Ah) — để so sánh B6 */
  ratedC20Ah: number;
};

export type FireBatteryRowResult = FireBatteryRow & {
  totalMA: number;
};

export type FireBatteryResults = {
  staticRows: FireBatteryRowResult[];
  alarmRows: FireBatteryRowResult[];
  totalStaticMA: number;
  totalAlarmMA: number;
  /** I_Q (A) */
  iqA: number;
  /** I_A (A) */
  iaA: number;
  /** C20 yêu cầu (Ah) */
  c20RequiredAh: number;
  /** I_C — dòng nạp tối thiểu (A) */
  icA: number;
  /** I_PSE (A) */
  ipseA: number;
  /** Ắc quy đủ nếu dung lượng lắp đặt ≥ C20 yêu cầu */
  batteryOk: boolean | null;
};
