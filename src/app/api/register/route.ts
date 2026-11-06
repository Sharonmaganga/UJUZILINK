import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normaliseKenyanPhone } from "@/lib/phone";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your full name"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  phone: z.string().trim().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["LEARNER", "TEACHER"]),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { name, email, password, role } = parsed.data;
  let phone: string | null = null;
  if (parsed.data.phone) {
    phone = normaliseKenyanPhone(parsed.data.phone);
    if (!phone) return NextResponse.json({ error: "Enter a valid Kenyan phone number" }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });

  await prisma.user.create({
    data: { name, email, phone, role, passwordHash: await bcrypt.hash(password, 10) },
  });
  return NextResponse.json({ ok: true });
}
