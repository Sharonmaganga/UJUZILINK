import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertImage, deleteImage, MAX_PREMISES_PHOTOS, saveImage, UploadError } from "@/lib/upload";
import { cleanFields, validateStep, type TeacherFields } from "@/lib/teacherForm";

function files(form: FormData, key: string) {
  return form.getAll(key).filter((v): v is File => v instanceof File && v.size > 0);
}

/** Draft as the owner may see it. The ID photo URL is never returned (only admins can view ID photos). */
function publicDraft(d: { data: unknown; idPhotoUrl: string | null; profilePhotoUrl: string | null; premisesPhotoUrls: string[] }) {
  return { fields: d.data as TeacherFields, hasIdPhoto: !!d.idPhotoUrl, profilePhotoUrl: d.profilePhotoUrl, premisesPhotoUrls: d.premisesPhotoUrls };
}

/**
 * POST /api/teacher/draft (multipart): "Save & continue" for the verification wizard.
 * Merges the given text fields and photos into the teacher's draft. With `step`, the merged draft must pass that
 * step's validation (nothing is saved otherwise). Photos are checked before any are stored, and replaced draft
 * photos are deleted unless the live profile still uses them.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.user.role !== "TEACHER") {
    return NextResponse.json({ error: "Only teacher accounts can do this" }, { status: 403 });
  }
  const userId = session.user.id;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Upload failed. Try smaller photos." }, { status: 400 });
  }
  const step = Number(form.get("step")) || 0;
  const incoming = cleanFields(Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === "string")));

  const idPhoto = files(form, "idPhoto")[0] ?? null;
  const profilePhoto = files(form, "profilePhoto")[0] ?? null;
  const premises = files(form, "premisesPhotos");
  if (premises.length > MAX_PREMISES_PHOTOS) {
    return NextResponse.json({ errors: { premisesPhotos: `Use at most ${MAX_PREMISES_PHOTOS} photos.` } }, { status: 400 });
  }

  const [draft, profile] = await Promise.all([
    prisma.teacherDraft.findUnique({ where: { userId } }),
    prisma.teacherProfile.findUnique({ where: { userId } }),
  ]);
  const fields: TeacherFields = { ...((draft?.data as TeacherFields) ?? {}), ...incoming };

  // Photos the profile would end up with (new upload > draft > live profile).
  const photos = {
    hasIdPhoto: !!idPhoto || !!draft?.idPhotoUrl || !!profile?.idPhotoUrl,
    hasProfilePhoto: !!profilePhoto || !!draft?.profilePhotoUrl || !!profile?.profilePhotoUrl,
    premisesCount: premises.length || draft?.premisesPhotoUrls.length || profile?.premisesPhotoUrls.length || 0,
  };
  if (step >= 1 && step <= 5) {
    const errors = validateStep(step, fields, photos);
    if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 400 });
  }

  try {
    await Promise.all([idPhoto, profilePhoto, ...premises].filter((f): f is File => !!f).map(assertImage));
    const [idUrl, profileUrl, premisesUrls] = await Promise.all([
      idPhoto ? saveImage(idPhoto, "ids") : null,
      profilePhoto ? saveImage(profilePhoto, "profiles") : null,
      premises.length ? Promise.all(premises.map((p) => saveImage(p, "premises"))) : null,
    ]);

    const saved = await prisma.teacherDraft.upsert({
      where: { userId },
      create: {
        userId,
        data: fields,
        idPhotoUrl: idUrl,
        profilePhotoUrl: profileUrl,
        premisesPhotoUrls: premisesUrls ?? [],
      },
      update: {
        data: fields,
        ...(idUrl ? { idPhotoUrl: idUrl } : {}),
        ...(profileUrl ? { profilePhotoUrl: profileUrl } : {}),
        ...(premisesUrls ? { premisesPhotoUrls: premisesUrls } : {}),
      },
    });

    // Clean up draft photos that were just replaced, unless the live profile still points at them.
    const inUse = new Set([profile?.idPhotoUrl, profile?.profilePhotoUrl, ...(profile?.premisesPhotoUrls ?? [])]);
    const replaced = [
      idUrl ? draft?.idPhotoUrl : null,
      profileUrl ? draft?.profilePhotoUrl : null,
      ...(premisesUrls ? draft?.premisesPhotoUrls ?? [] : []),
    ].filter((u): u is string => !!u && !inUse.has(u));
    await Promise.all(replaced.map(deleteImage));

    return NextResponse.json({ ok: true, draft: publicDraft(saved) });
  } catch (e) {
    if (e instanceof UploadError) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }
}
