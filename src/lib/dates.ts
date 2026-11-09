const DAY_MS = 24 * 60 * 60 * 1000;

export const fmtDate = (d: Date) => d.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
export const fmtDateTime = (d: Date) =>
  d.toLocaleString("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Nairobi" });

/** Whole days left until `until` (rounded up), never negative. */
export function daysLeft(until: Date | null, now = new Date()) {
  if (!until) return 0;
  return Math.max(0, Math.ceil((until.getTime() - now.getTime()) / DAY_MS));
}
