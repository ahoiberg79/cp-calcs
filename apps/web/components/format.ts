export function fmtUnits(n: unknown, dec?: number): string {
  if (typeof n !== "number" || !Number.isFinite(n)) return "—";
  const digits = dec ?? (n % 1 === 0 ? 0 : 1);
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}
export const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
