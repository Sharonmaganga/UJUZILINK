import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** GET /api/mpesa/status?id=<paymentId>: lets the dashboard follow a payment the teacher started. */
export async function GET(req: Request) {
  const session = await getSession();
  if (session?.user.role !== "TEACHER") return NextResponse.json({ error: "Teachers only" }, { status: 403 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const payment = await prisma.payment.findFirst({
    where: { id, teacher: { userId: session.user.id } },
    select: { id: true, status: true, resultDesc: true, mpesaReceipt: true, createdAt: true },
  });
  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  return NextResponse.json(payment);
}
