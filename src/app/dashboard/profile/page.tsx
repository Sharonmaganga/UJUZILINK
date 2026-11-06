import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login?callbackUrl=/dashboard/profile");
  if (session.user.role !== "TEACHER") redirect("/");

  const [t, user] = await Promise.all([
    prisma.teacherProfile.findUnique({ where: { userId: session.user.id } }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { phone: true } }),
  ]);

  return (
    <div className="stack" style={{ maxWidth: 720 }}>
      <h1>{t ? "Edit your teacher profile" : "Set up your teacher profile"}</h1>
      <ProfileForm
        defaultPhone={user?.phone ? `0${user.phone.slice(3)}` : ""}
        existing={
          t && {
            skill: t.skill,
            otherSkills: t.otherSkills,
            bio: t.bio,
            phone: t.phone,
            whatsapp: t.whatsapp,
            businessName: t.businessName,
            address: t.address,
            latitude: t.latitude,
            longitude: t.longitude,
            idNumber: t.idNumber,
            hasIdPhoto: !!t.idPhotoUrl,
            profilePhotoUrl: t.profilePhotoUrl,
            premisesPhotoUrls: t.premisesPhotoUrls,
          }
        }
      />
    </div>
  );
}
