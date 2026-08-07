/** حساب الأعمار والمدد بالأشهر والأسابيع (يعمل بالكامل بدون إنترنت). */

export const DAY = 86400000;

export function parseDate(iso: string) {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

export function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addMonths(d: Date, months: number) {
  const out = new Date(d.getFullYear(), d.getMonth() + months, 1);
  const lastDay = new Date(out.getFullYear(), out.getMonth() + 1, 0).getDate();
  out.setDate(Math.min(d.getDate(), lastDay));
  return out;
}

export function addDays(d: Date, days: number) {
  const out = new Date(d.getTime());
  out.setDate(out.getDate() + days);
  return out;
}

export const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export type Span = { months: number; weeks: number; days: number; totalDays: number };

/** الفرق بين تاريخين بالأشهر والأسابيع والأيام (0 إذا كان الثاني قبل الأول). */
export function spanBetween(from: Date, to: Date): Span {
  const a = startOfDay(from);
  const b = startOfDay(to);
  if (b.getTime() <= a.getTime()) return { months: 0, weeks: 0, days: 0, totalDays: 0 };

  let months = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  if (b.getDate() < a.getDate()) months -= 1;
  if (months < 0) months = 0;

  const anchor = addMonths(a, months);
  const restDays = Math.round((b.getTime() - anchor.getTime()) / DAY);
  return {
    months,
    weeks: Math.floor(restDays / 7),
    days: restDays % 7,
    totalDays: Math.round((b.getTime() - a.getTime()) / DAY),
  };
}

const ar = (n: number) => n.toLocaleString("ar-EG");

/** صياغة عربية: «١٤ شهر و٢ أسبوع» */
export function spanLabel(s: Span) {
  const parts: string[] = [];
  if (s.months) parts.push(`${ar(s.months)} شهر`);
  if (s.weeks) parts.push(`${ar(s.weeks)} أسبوع`);
  if (!s.months && !s.weeks) parts.push(`${ar(s.days)} يوم`);
  return parts.join(" و");
}
