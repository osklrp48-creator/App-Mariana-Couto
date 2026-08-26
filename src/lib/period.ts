export type PeriodType = "dia" | "mes" | "ano";

export function matchesPeriod(dateISO: string, type: PeriodType, value: string): boolean {
  if (!value) return false;
  if (type === "dia") return dateISO === value;
  if (type === "mes") return dateISO.startsWith(value);
  return dateISO.startsWith(value); // ano: value = "YYYY"
}
