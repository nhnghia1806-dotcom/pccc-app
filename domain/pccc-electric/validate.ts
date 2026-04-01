import type { Inputs, Warning } from "./models";

export function validateInputs(i: Inputs): Warning[] {
  const w: Warning[] = [];

  if (i.cosPhi < 0.8 || i.cosPhi > 0.85) {
    w.push({
      code: "cosPhi_out_of_range",
      message: "cosφ thường lấy trong khoảng 0.8 đến 0.85 (nếu không có số liệu chính xác).",
    });
  }

  if (i.kdp < 1.1 || i.kdp > 1.25) {
    w.push({
      code: "kdp_out_of_range",
      message: "kdp thường lấy từ 1.1 đến 1.25.",
    });
  }

  if (i.kyc !== 1) {
    w.push({
      code: "kyc_not_1",
      message: "Theo TCVN 9206:2012 mục 5.10, Kyc = 1 cho động cơ thiết bị chữa cháy.",
    });
  }

  return w;
}

