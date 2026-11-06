import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extendFrom } from "@/lib/subscription";

type CallbackItem = { Name: string; Value?: string | number };
type StkCallback = {
  Body?: {
    stkCallback?: {
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: { Item: CallbackItem[] };
    };
  };
};

/** Safaricom calls this after the teacher completes (or cancels) the STK push. */
export async function POST(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (process.env.MPESA_CALLBACK_TOKEN && token !== process.env.MPESA_CALLBACK_TOKEN) {
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as StkCallback;
  const cb = body.Body?.stkCallback;
  if (!cb) return NextResponse.json({ ResultCode: 1, ResultDesc: "Bad request" }, { status: 400 });

  const payment = await prisma.payment.findUnique({
    where: { checkoutRequestId: cb.CheckoutRequestID },
  });
  // Ignore unknown or already-processed payments (Safaricom may retry).
  if (!payment || payment.status !== "PENDING") return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });

  if (cb.ResultCode === 0) {
    const items = cb.CallbackMetadata?.Item ?? [];
    const receipt = items.find((i) => i.Name === "MpesaReceiptNumber")?.Value;
    const amount = Number(items.find((i) => i.Name === "Amount")?.Value ?? 0);
    const paidEnough = amount >= payment.amount;

    await prisma.$transaction(async (tx) => {
      // Claim the payment atomically so a retried callback can't extend the subscription twice.
      const claimed = await tx.payment.updateMany({
        where: { id: payment.id, status: "PENDING" },
        data: {
          status: paidEnough ? "SUCCESS" : "FAILED",
          mpesaReceipt: receipt ? String(receipt) : null,
          resultDesc: paidEnough ? cb.ResultDesc : `Paid ${amount}, expected ${payment.amount}`,
        },
      });
      if (claimed.count === 1 && paidEnough) {
        const teacher = await tx.teacherProfile.findUniqueOrThrow({ where: { id: payment.teacherId } });
        await tx.teacherProfile.update({ where: { id: teacher.id }, data: { paidUntil: extendFrom(teacher) } });
      }
    });
  } else {
    await prisma.payment.updateMany({
      where: { id: payment.id, status: "PENDING" },
      data: { status: "FAILED", resultDesc: cb.ResultDesc },
    });
  }

  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}
