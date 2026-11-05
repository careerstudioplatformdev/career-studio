// Dates are stored as "YYYY-MM", or "YYYY" when only the year is known (we never
// guess a month). Empty string means unknown.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function isValidMonth(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function isYearOnly(value: string): boolean {
  return /^\d{4}$/.test(value);
}

/**
 * Months since year 0, or null when the date is unknown/invalid. Year-only
 * dates count as January for starts and December for ends, the most generous
 * reading, so we don't flag problems that may not exist.
 */
export function toMonthIndex(value: string, asEnd = false): number | null {
  if (isYearOnly(value)) return Number(value) * 12 + (asEnd ? 11 : 0);
  if (!isValidMonth(value)) return null;
  const [y, m] = value.split("-").map(Number);
  return y * 12 + (m - 1);
}

export function currentMonth(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function formatMonth(value: string): string {
  if (isYearOnly(value)) return value;
  if (!isValidMonth(value)) return "";
  const [y, m] = value.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

export function formatRange(start: string, end: string, current: boolean): string {
  const s = formatMonth(start);
  const e = current ? "Present" : formatMonth(end);
  if (s && e) return `${s} – ${e}`;
  return s || e;
}

const MONTH_LOOKUP: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
  may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9,
  september: 9, oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
};

/**
 * Parse loose date text from a resume ("Jan 2021", "01/2021", "2021").
 * Returns "YYYY-MM", "YYYY" for a bare year (reported as imprecise), or "" when unclear.
 */
export function parseLooseDate(text: string): { value: string; precise: boolean } {
  const t = text.trim().toLowerCase();
  let m = t.match(/^([a-z]+)\.?\s+(\d{4})$/);
  if (m && MONTH_LOOKUP[m[1]]) {
    return { value: `${m[2]}-${String(MONTH_LOOKUP[m[1]]).padStart(2, "0")}`, precise: true };
  }
  m = t.match(/^(\d{1,2})\s*\/\s*(\d{4})$/);
  if (m && Number(m[1]) >= 1 && Number(m[1]) <= 12) {
    return { value: `${m[2]}-${m[1].padStart(2, "0")}`, precise: true };
  }
  m = t.match(/^(\d{4})$/);
  if (m) return { value: m[1], precise: false };
  return { value: "", precise: false };
}
