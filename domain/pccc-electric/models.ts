export type NamedLoad = {
  name: string;
  kw: number;
  quantity: number;
};

export type BackupPump = {
  name: string;
  kw: number;
  kkD: number;
};

export type Inputs = {
  kdt: number; // hệ số đồng thời
  kyc: number; // hệ số yêu cầu
  cosPhi: number;
  kdp: number; // hệ số dự phòng máy phát
  pumpsMain: NamedLoad[];
  otherLoads: NamedLoad[];
  backupPumps: BackupPump[];
};

export type Results = {
  pb: number;
  pkhac: number;
  ptt: number;
  smba: number;
  pkd: number;
  stt: number;
  skd: number;
  smpd: number;
};

export type Warning = { code: string; message: string };

