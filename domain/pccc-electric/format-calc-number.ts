/**
 * Chuỗi hiển thị kết quả tính toán: gom nhiễu float (vd. 0.574999… → "0.575"),
 * bỏ số 0 thừa cuối. Phép tính vẫn dùng số thực; chỉ định dạng hiển thị.
 *
 * Làm tròn tới 12 chữ số thập phân trước khi in — phù hợp công suất kW/kVA PCCC.
 */
const DISPLAY_FRAC_DIGITS = 12;
const SCALE = 10 ** DISPLAY_FRAC_DIGITS;

export function formatCalcNumber(n: number): string {
  if (!Number.isFinite(n)) return "0";
  if (n === 0) return "0";

  const sign = n < 0 ? "-" : "";
  const x = Math.abs(n);
  const cleaned = Math.round(x * SCALE) / SCALE;

  let s = cleaned.toFixed(DISPLAY_FRAC_DIGITS).replace(/\.?0+$/, "");
  if (s === "" || s === ".") s = "0";

  return sign + s;
}
