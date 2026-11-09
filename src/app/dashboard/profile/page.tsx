import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PRICE_KES, TRIAL_DAYS } from "@/lib/subscription";
import { validateStep, type TeacherFields } from "@/lib/teacherForm";
import Icon from "@/components/Icon";
import VerifyWizard from "./VerifyWizard";

export const metadata = { title: "Get verified · Ujuzi Link" };

const local = (p?: string | null) => (p ? `0${p.slice(3)}` : "");

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ step?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login?callbackUrl=/dashboard/profile");
  if (session.user.role !== "TEACHER") redirect("/");
  const userId = session.user.id;

  const [user, t, draft] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true, phone: true } }),
    prisma.teacherProfile.findUnique({ where: { userId } }),
    prisma.teacherDraft.findUnique({ where: { userId } }),
  ]);

  // Start from the live profile (if any), then layer the saved draft on top.
  const fromProfile: TeacherFields = t
    ? {
        name: user?.name,
        skill: t.skill,
        otherSkills: t.otherSkills.join(", "),
        businessName: t.businessName ?? "",
        bio: t.bio,
        phone: local(t.phone),
        whatsapp: local(t.whatsapp),
        idNumber: t.idNumber,
        address: t.address,
        latitude: t.latitude,
        longitude: t.longitude,
      }
    : { name: user?.name, phone: local(user?.phone) };
  const fields: TeacherFields = { ...fromProfile, ...((draft?.data as TeacherFields) ?? {}) };
  const photos = {
    hasIdPhoto: !!(draft?.idPhotoUrl || t?.idPhotoUrl),
    profilePhotoUrl: draft?.profilePhotoUrl ?? t?.profilePhotoUrl ?? null,
    premisesPhotoUrls: draft?.premisesPhotoUrls.length ? draft.premisesPhotoUrls : t?.premisesPhotoUrls ?? [],
  };

  // Resume where the teacher left off unless a step was requested.
  const ps = { hasIdPhoto: photos.hasIdPhoto, hasProfilePhoto: !!photos.profilePhotoUrl, premisesCount: photos.premisesPhotoUrls.length };
  const firstIncomplete = [1, 2, 3, 4].find((n) => Object.keys(validateStep(n, fields, ps)).length > 0) ?? 5;
  const requested = Number((await searchParams).step);
  const step = requested >= 1 && requested <= 5 ? Math.min(requested, firstIncomplete) : t ? 1 : firstIncomplete;

  return (
    <div className="container page verify-page">
      <Link href="/dashboard" className="back-link"><Icon name="arrowLeft" /> {t ? "Back to dashboard" : "Teacher workspace"}</Link>
      <h1>{t?.status === "APPROVED" ? "Your teacher profile" : <>Get verified. <span className="hide-sm">Start teaching.</span></>}</h1>
      <p className="muted" style={{ margin: "8px 0 28px" }}>
        {t?.status === "APPROVED"
          ? "Keep your details and photos up to date."
          : "Complete the steps below. Our team reviews teacher profiles before they appear in search."}
      </p>
      <VerifyWizard
        initialStep={step}
        initialFields={fields}
        initialPhotos={photos}
        email={user?.email ?? ""}
        status={t?.status ?? null}
        rejectionReason={t?.rejectionReason ?? null}
        teacherId={t?.id ?? null}
        trialDays={TRIAL_DAYS}
        price={PRICE_KES}
      />
    </div>
  );
}
