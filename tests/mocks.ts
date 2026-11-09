import { vi } from "vitest";

/** In-memory stand-ins for the Prisma client and the session, shared by the route tests. */
export const db = {
  payment: { findUnique: vi.fn(), findFirst: vi.fn(), updateMany: vi.fn(), create: vi.fn() },
  teacherProfile: { findUnique: vi.fn(), findUniqueOrThrow: vi.fn(), update: vi.fn(), findMany: vi.fn() },
  auditLog: { create: vi.fn() },
  $transaction: vi.fn(async (fn: (tx: unknown) => unknown) => fn(db)),
};

export const session = { current: null as null | { user: { id: string; role: string; name: string } } };

vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/lib/auth", () => ({ getSession: async () => session.current }));

export function resetMocks() {
  for (const model of [db.payment, db.teacherProfile, db.auditLog]) {
    for (const fn of Object.values(model)) fn.mockReset();
  }
  session.current = null;
}

export const json = (url: string, body: unknown) =>
  new Request(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
