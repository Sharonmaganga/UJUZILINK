import { describe, expect, it } from "vitest";
import { activeUntil, addDays, extendFrom, isActive, PERIOD_DAYS } from "@/lib/subscription";

const now = new Date("2026-06-01T12:00:00Z");

describe("subscription rules", () => {
  it("is inactive before any trial or payment", () => {
    expect(activeUntil({ trialEndsAt: null, paidUntil: null })).toBeNull();
    expect(isActive({ trialEndsAt: null, paidUntil: null }, now)).toBe(false);
  });

  it("is active during the free trial and inactive after it", () => {
    expect(isActive({ trialEndsAt: addDays(now, 3), paidUntil: null }, now)).toBe(true);
    expect(isActive({ trialEndsAt: addDays(now, -1), paidUntil: null }, now)).toBe(false);
  });

  it("uses the later of trial end and paid-until", () => {
    const t = { trialEndsAt: addDays(now, 5), paidUntil: addDays(now, 20) };
    expect(activeUntil(t)).toEqual(addDays(now, 20));
  });

  it("extends an active period by 30 days from its end", () => {
    const t = { trialEndsAt: addDays(now, 10), paidUntil: null };
    expect(extendFrom(t, now)).toEqual(addDays(now, 10 + PERIOD_DAYS));
  });

  it("starts a new 30-day period from payment time if expired", () => {
    const t = { trialEndsAt: addDays(now, -40), paidUntil: addDays(now, -5) };
    expect(extendFrom(t, now)).toEqual(addDays(now, PERIOD_DAYS));
  });
});
