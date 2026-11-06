import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isActive } from "@/lib/subscription";

export default async function TeacherPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [teacher, session] = await Promise.all([
    prisma.teacherProfile.findUnique({ where: { id }, include: { user: { select: { name: true } } } }),
    getSession(),
  ]);
  const isOwner = !!session && teacher?.userId === session.user.id;
  const isAdmin = session?.user.role === "ADMIN";
  if (!teacher || (!(teacher.status === "APPROVED" && isActive(teacher)) && !isOwner && !isAdmin)) notFound();

  const directions = `https://www.google.com/maps/dir/?api=1&destination=${teacher.latitude},${teacher.longitude}`;
  const wa = teacher.whatsapp ?? teacher.phone;

  return (
    <div className="stack">
      <div className="card row" style={{ alignItems: "flex-start", gap: 20 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={teacher.profilePhotoUrl} alt={teacher.user.name} className="avatar lg" />
        <div className="stack" style={{ gap: 6, flex: 1, minWidth: 220 }}>
          <h1 style={{ margin: 0 }}>{teacher.user.name}</h1>
          <div>
            <span className="badge green">ID verified</span>
          </div>
          <div style={{ fontSize: "1.1rem" }}>
            {teacher.skill}
            {teacher.businessName ? ` · ${teacher.businessName}` : ""}
          </div>
          {teacher.otherSkills.length > 0 && <div className="small muted">Also teaches: {teacher.otherSkills.join(", ")}</div>}
          <div className="small muted">{teacher.address}</div>
        </div>
      </div>

      <div className="card">
        <h2>About</h2>
        <p style={{ whiteSpace: "pre-wrap" }}>{teacher.bio}</p>
      </div>

      <div className="card stack">
        <h2>Contact</h2>
        {session ? (
          <>
            <div className="row">
              <a className="btn" href={`tel:+${teacher.phone}`}>
                Call +{teacher.phone}
              </a>
              <a className="btn secondary" href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer">
                WhatsApp
              </a>
              <a className="btn secondary" href={directions} target="_blank" rel="noreferrer">
                Get directions
              </a>
            </div>
            <p className="small muted">
              Agree on what you&apos;ll learn and the price before you start. You pay the teacher directly. Ujuzi Link
              never asks you to pay through the app, and you should meet at the verified place of trade shown below.
            </p>
          </>
        ) : (
          <p>
            <Link href={`/login?callbackUrl=/teachers/${teacher.id}`}>Sign in</Link> or{" "}
            <Link href="/register">create a free account</Link> to see this teacher&apos;s phone number and WhatsApp.
          </p>
        )}
      </div>

      {teacher.premisesPhotoUrls.length > 0 && (
        <div className="card">
          <h2>Place of trade</h2>
          <div className="photos">
            {teacher.premisesPhotoUrls.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={url} src={url} alt="Premises" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
