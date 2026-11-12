import type { Prisma, PrismaClient } from "@prisma/client";

type Db = PrismaClient | Prisma.TransactionClient;

export type AuditAction = "teacher.approve" | "teacher.reject" | "teacher.revoke";

/** Records an admin decision. Pass the transaction client so the log and the change commit together. */
export function audit(
  db: Db,
  entry: { actorId: string; action: AuditAction; targetId: string; detail?: string | null; targetType?: string },
) {
  return db.auditLog.create({
    data: {
      actorId: entry.actorId,
      action: entry.action,
      targetType: entry.targetType ?? "TeacherProfile",
      targetId: entry.targetId,
      detail: entry.detail ?? null,
    },
  });
}
