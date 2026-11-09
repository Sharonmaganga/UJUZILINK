import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertImage, MAX_PREMISES_PHOTOS, saveImage, UploadError } from "@/lib/upload";
import { normaliseKenyanPhone } from "@/lib/phone";

const fields = z.object({
  skill: z.string().trim().min(2, "Enter the skill you teach"),
  otherSkills: z.string().optional(),
  bio: z.string().trim().min(20, "Tell learners a bit more about yourself (at least 20 characters)"),
  phone: z.string().trim().min(9, "Enter your phone number"),
  whatsapp: z.string().trim().optional(),
  businessName: z.string().trim().optional(),
  address: z.string().trim().min(3, "Enter the address or landmark of your place of trade"),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  idNumber: z.string().trim().min(5, "Enter your national ID or passport number"),
});

function file(form: FormData, key: string): File | null {
  const v = form.get(key);
  return v instanceof File && v.size > 0 ? v : null;
}

/** Create or update the signed-in teacher's profile and submit it for verification. */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.user.role !== "TEACHER") {
    return NextResponse.json({ error: "Only teacher accounts can do this" }, { status: 403 });
  }

  const form = await req.formData();
  const parsed = fields.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const d = parsed.data;

  const phone = normaliseKenyanPhone(d.phone);
  if (!phone) return NextResponse.json({ error: "Enter a valid Kenyan phone number" }, { status: 400 });
  const whatsapp = d.whatsapp ? normaliseKenyanPhone(d.whatsapp) : null;

  const existing = await prisma.teacherProfile.findUnique({ where: { userId: session.user.id } });

  try {
    const idPhoto = file(form, "idPhoto");
    const profilePhoto = file(form, "profilePhoto");
    const premises = form.getAll("premisesPhotos").filter((v): v is File => v instanceof File && v.size > 0);

    if (premises.length > MAX_PREMISES_PHOTOS) {
      return NextResponse.json({ error: `Upload at most ${MAX_PREMISES_PHOTOS} premises photos` }, { status: 400 });
    }

    // Validate every file before writing any, so a bad photo doesn't leave orphaned uploads behind.
    await Promise.all([idPhoto, profilePhoto, ...premises].filter((f): f is File => !!f).map(assertImage));

    const idPhotoUrl = idPhoto ? await saveImage(idPhoto, "ids") : existing?.idPhotoUrl;
    const profilePhotoUrl = profilePhoto ? await saveImage(profilePhoto, "profiles") : existing?.profilePhotoUrl;
    const premisesPhotoUrls = premises.length
      ? await Promise.all(premises.map((p) => saveImage(p, "premises")))
      : existing?.premisesPhotoUrls ?? [];

    if (!idPhotoUrl) return NextResponse.json({ error: "Upload a photo of your ID" }, { status: 400 });
    if (!profilePhotoUrl) return NextResponse.json({ error: "Upload a profile photo of yourself" }, { status: 400 });
    if (premisesPhotoUrls.length === 0) {
      return NextResponse.json({ error: "Upload at least one photo of your premises or place of trade" }, { status: 400 });
    }

    const data = {
      skill: d.skill,
      otherSkills: (d.otherSkills ?? "")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 10),
      bio: d.bio,
      phone,
      whatsapp,
      businessName: d.businessName || null,
      address: d.address,
      latitude: d.latitude,
      longitude: d.longitude,
      idNumber: d.idNumber,
      idPhotoUrl,
      profilePhotoUrl,
      premisesPhotoUrls,
      // Any change to an approved profile keeps it live; new or rejected profiles go (back) to review.
      status: existing?.status === "APPROVED" ? ("APPROVED" as const) : ("PENDING" as const),
      rejectionReason: null,
    };

    await prisma.teacherProfile.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, ...data },
      update: data,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof UploadError) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }
}
