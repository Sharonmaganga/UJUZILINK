import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Shell, { teacherNav } from "@/components/Shell";
import ProfileForm from "./ProfileForm";

export const metadata = { title: "My profile · Ujuzi Link" };

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login?callbackUrl=/dashboard/profile");
  if (session.user.role !== "TEACHER") redirect("/");

  const [t, user] = await Promise.all([
    prisma.teacherProfile.findUnique({ where: { userId: session.user.id } }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { phone: true } }),
  ]);

  return (
    <Shell title="Your workspace" items={teacherNav(t?.id)} active="profile">
      <div className="shell-head">
        <div>
          <h1>{t ? "Your teacher profile" : "Set up your teacher profile"}</h1>
          <p className="muted">Four short sections. You can save and come back to edit any time.</p>
        </div>
      </div>
      <div className="narrow">
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
              status: t.status,
            }
          }
        />
      </div>
    </Shell>
  );
}
