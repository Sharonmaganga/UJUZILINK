import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mpesaConfigured, stkPush } from "@/lib/mpesa";
import { normaliseKenyanPhone } from "@/lib/phone";
import { PRICE_KES } from "@/lib/subscription";

/** A new STK push is refused while an earlier one may still be waiting on the phone. */
const PENDING_WINDOW_MS = 2 * 60 * 1000;

/** Starts an M-Pesa STK push so the teacher can pay the monthly fee from their phone. */
export async function POST(req: Request) {
  const session = await getSession();
  if (session?.user.role !== "TEACHER") return NextResponse.json({ error: "Teachers only" }, { status: 403 });
  if (!mpesaConfigured()) {
    return NextResponse.json({ error: "M-Pesa payments are not set up yet. Please try again later." }, { status: 503 });
  }

  const teacher = await prisma.teacherProfile.findUnique({ where: { userId: session.user.id } });
  if (!teacher || teacher.status !== "APPROVED") {
    return NextResponse.json({ error: "Your profile must be verified before you can subscribe" }, { status: 400 });
  }

  const body = (await req.json().catch(() => ({}))) as { phone?: string };
  const phone = normaliseKenyanPhone(body.phone ?? teacher.phone);
  if (!phone) return NextResponse.json({ error: "Enter a valid Safaricom number" }, { status: 400 });

  const waiting = await prisma.payment.findFirst({
    where: { teacherId: teacher.id, status: "PENDING", createdAt: { gt: new Date(Date.now() - PENDING_WINDOW_MS) } },
    orderBy: { createdAt: "desc" },
  });
  if (waiting) {
    return NextResponse.json(
      { error: "A payment request was just sent to your phone. Complete or cancel it, then try again.", paymentId: waiting.id },
      { status: 409 },
    );
  }

  try {
    const { checkoutRequestId, message } = await stkPush({
      phone,
      amount: PRICE_KES,
      reference: "UjuziLink",
      description: "Subscription",
    });
    const payment = await prisma.payment.create({
      data: { teacherId: teacher.id, amount: PRICE_KES, phone, checkoutRequestId },
    });
    return NextResponse.json({ ok: true, paymentId: payment.id, message: message ?? "Check your phone and enter your M-Pesa PIN" });
  } catch (e) {
    console.error("STK push failed", e);
    return NextResponse.json({ error: "Could not start the M-Pesa payment. Please try again." }, { status: 502 });
  }
}
