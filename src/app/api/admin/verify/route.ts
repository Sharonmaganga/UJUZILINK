import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { addDays, TRIAL_DAYS } from "@/lib/subscription";

const schema = z.object({
  teacherId: z.string(),
  // approve: start (or restore) the listing; reject: send a pending profile back;
  // revoke: take an approved teacher out of search.
  action: z.enum(["approve", "reject", "revoke"]),
  reason: z.string().trim().max(500).optional(),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (session?.user.role !== "ADMIN") return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { teacherId, action, reason } = parsed.data;

  const teacher = await prisma.teacherProfile.findUnique({ where: { id: teacherId } });
  if (!teacher) return NextResponse.json({ error: "Teacher not found" }, { status: 404 });

  if (action === "revoke" && teacher.status !== "APPROVED") {
    return NextResponse.json({ error: "Only approved teachers can be revoked" }, { status: 409 });
  }
  if ((action === "reject" || action === "revoke") && !reason) {
    return NextResponse.json({ error: "Give a reason. The teacher will see it." }, { status: 400 });
  }

  const actorId = session.user.id;
  await prisma.$transaction(async (tx) => {
    if (action === "approve") {
      const now = new Date();
      const trialEndsAt = teacher.trialEndsAt ?? addDays(now, TRIAL_DAYS);
      await tx.teacherProfile.update({
        where: { id: teacherId },
        data: {
          status: "APPROVED",
          rejectionReason: null,
          verifiedAt: now,
          // The free month starts the first time a teacher is approved.
          trialEndsAt,
        },
      });
      await audit(tx, {
        actorId,
        action: "teacher.approve",
        targetId: teacherId,
        detail: teacher.trialEndsAt ? "Re-approved (trial already used)" : `Free trial until ${trialEndsAt.toISOString().slice(0, 10)}`,
      });
    } else {
      await tx.teacherProfile.update({
        where: { id: teacherId },
        data: { status: "REJECTED", rejectionReason: reason },
      });
      await audit(tx, { actorId, action: action === "reject" ? "teacher.reject" : "teacher.revoke", targetId: teacherId, detail: reason });
    }
  });
  return NextResponse.json({ ok: true });
}
