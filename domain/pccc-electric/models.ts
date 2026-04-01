export type NamedLoad = {
  name: string;
  kw: number;
  quantity: number;
};

export type BackupPump = {
  name: string;
  kw: number;
  quantity: number;
};

export type Inputs = {
  kyc: number; // hệ số yêu cầu
  /** Kkđ chung — nhân Σ(Pđm·SL) bơm dự phòng khi tính Pkđ */
  kkD: number;
  cosPhi: number;
  kdp: number; // hệ số dự phòng máy phát
  pumpsMain: NamedLoad[];
  backupPumps: BackupPump[];
};

export type Results = {
  /** Σ P_i — tổng (P_đm × SL), kW */
  sumPi: number;
  /** Kyc · Σ(Pđm·SL) bảng bơm dự phòng — khác `ptt` (MBA) */
  pttBackup: number;
  /** P_tt = K_yc · Σ P_i — phụ tải tính toán MBA, không gồm bơm dự phòng */
  ptt: number;
  smba: number;
  pkd: number;
  /** P_tt (bơm dự phòng) / cosφ — dùng trong khối máy phát */
  stt: number;
  skd: number;
  smpd: number;
};

export type Warning = { code: string; message: string };

