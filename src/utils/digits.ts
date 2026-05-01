const MYANMAR_DIGITS = "၀၁၂၃၄၅၆၇၈၉";
const ASCII_DIGITS = "0123456789";

/** Map Myanmar digit characters to ASCII; other chars pass through. */
export function myanmarDigitsToAscii(input: string): string {
  let out = "";
  for (const ch of input) {
    const i = MYANMAR_DIGITS.indexOf(ch);
    out += i >= 0 ? ASCII_DIGITS[i] : ch;
  }
  return out;
}

/** Integer sort key from song number string (Myanmar or mixed). */
export function songNumberToSortInt(raw: string): number {
  const ascii = myanmarDigitsToAscii(raw.trim()).replace(/\D/g, "");
  const n = parseInt(ascii, 10);
  return Number.isFinite(n) ? n : 0;
}

/** NFC + trim for display/search consistency. */
export function normalizeMyTitle(s: string): string {
  return s.normalize("NFC").trim();
}
