export const PRICE_KES = Number(process.env.SUBSCRIPTION_PRICE_KES ?? 500);
export const TRIAL_DAYS = Number(process.env.FREE_TRIAL_DAYS ?? 30);
export const PERIOD_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

export function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS);
}

type Sub = { trialEndsAt: Date | null; paidUntil: Date | null };

/** The date until which the teacher is featured in search, or null if never activated. */
export function activeUntil(t: Sub): Date | null {
  const dates = [t.trialEndsAt, t.paidUntil].filter((d): d is Date => !!d);
  if (dates.length === 0) return null;
  return new Date(Math.max(...dates.map((d) => d.getTime())));
}

export function isActive(t: Sub, now = new Date()) {
  const until = activeUntil(t);
  return !!until && until > now;
}

/** A new payment adds PERIOD_DAYS on top of whatever time the teacher still has left. */
export function extendFrom(t: Sub, now = new Date()) {
  const until = activeUntil(t);
  const base = until && until > now ? until : now;
  return addDays(base, PERIOD_DAYS);
}

/** Prisma "where" fragment for teachers who should appear in search right now. */
export function activeWhere(now = new Date()) {
  return {
    status: "APPROVED" as const,
    OR: [{ trialEndsAt: { gt: now } }, { paidUntil: { gt: now } }],
  };
}
