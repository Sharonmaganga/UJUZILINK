import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addDays, TRIAL_DAYS } from "@/lib/subscription";

const schema = z.object({
  teacherId: z.string(),
  action: z.enum(["approve", "reject"]),
  reason: z.string().trim().optional(),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (session?.user.role !== "ADMIN") return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { teacherId, action, reason } = parsed.data;

  const teacher = await prisma.teacherProfile.findUnique({ where: { id: teacherId } });
  if (!teacher) return NextResponse.json({ error: "Teacher not found" }, { status: 404 });

  if (action === "approve") {
    const now = new Date();
    await prisma.teacherProfile.update({
      where: { id: teacherId },
      data: {
        status: "APPROVED",
        rejectionReason: null,
        verifiedAt: now,
        // The free month starts the first time a teacher is approved.
        trialEndsAt: teacher.trialEndsAt ?? addDays(now, TRIAL_DAYS),
      },
    });
  } else {
    await prisma.teacherProfile.update({
      where: { id: teacherId },
      data: { status: "REJECTED", rejectionReason: reason || "Your documents could not be verified" },
    });
  }
  return NextResponse.json({ ok: true });
}
