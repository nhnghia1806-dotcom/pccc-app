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
  kdt: number; // hệ số đồng thời
  kyc: number; // hệ số yêu cầu
  /** Kkđ chung — nhân PB trong Ptt MBA và nhân Σ(Pđm·SL) bơm dự phòng khi tính Pkđ */
  kkD: number;
  cosPhi: number;
  kdp: number; // hệ số dự phòng máy phát
  pumpsMain: NamedLoad[];
  otherLoads: NamedLoad[];
  backupPumps: BackupPump[];
};

export type Results = {
  pb: number;
  pkhac: number;
  /** Kđt · Kyc · Σ(Pđm·SL) chỉ bảng bơm dự phòng — khác hẳn `ptt` (MBA) */
  pttBackup: number;
  /** Kđt · (PB·Kkđ + PBC) — tổng phụ tải cho MBA, không gồm bơm dự phòng */
  ptt: number;
  smba: number;
  pkd: number;
  /** P_tt (bơm dự phòng) / cosφ — dùng trong khối máy phát */
  stt: number;
  skd: number;
  smpd: number;
};

export type Warning = { code: string; message: string };

