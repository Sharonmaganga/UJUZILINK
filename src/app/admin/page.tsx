import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { activeWhere } from "@/lib/subscription";
import ReviewButtons from "./ReviewButtons";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login?callbackUrl=/admin");
  if (session.user.role !== "ADMIN") redirect("/");

  const [pending, learners, teachers, featured, revenue] = await Promise.all([
    prisma.teacherProfile.findMany({
      where: { status: "PENDING" },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { updatedAt: "asc" },
    }),
    prisma.user.count({ where: { role: "LEARNER" } }),
    prisma.teacherProfile.count({ where: { status: "APPROVED" } }),
    prisma.teacherProfile.count({ where: activeWhere() }),
    prisma.payment.aggregate({ where: { status: "SUCCESS" }, _sum: { amount: true } }),
  ]);

  return (
    <div className="stack">
      <h1>Admin</h1>
      <div className="grid">
        <div className="card"><div className="muted small">Learners</div><strong style={{ fontSize: "1.6rem" }}>{learners}</strong></div>
        <div className="card"><div className="muted small">Verified teachers</div><strong style={{ fontSize: "1.6rem" }}>{teachers}</strong></div>
        <div className="card"><div className="muted small">Featured now</div><strong style={{ fontSize: "1.6rem" }}>{featured}</strong></div>
        <div className="card"><div className="muted small">Revenue (KES)</div><strong style={{ fontSize: "1.6rem" }}>{revenue._sum.amount ?? 0}</strong></div>
      </div>

      <h2>Waiting for verification ({pending.length})</h2>
      {pending.length === 0 && <p className="muted">Nothing to review.</p>}
      {pending.map((t) => (
        <div key={t.id} className="card stack">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <strong>{t.user.name}</strong> <span className="muted small">{t.user.email} · +{t.phone}</span>
              <div>{t.skill}{t.businessName ? ` · ${t.businessName}` : ""}</div>
              <div className="small muted">
                ID number: {t.idNumber} · {t.address} ·{" "}
                <a href={`https://www.google.com/maps?q=${t.latitude},${t.longitude}`} target="_blank" rel="noreferrer">
                  view pin on map
                </a>
              </div>
            </div>
            <ReviewButtons teacherId={t.id} />
          </div>
          <p className="small" style={{ whiteSpace: "pre-wrap" }}>{t.bio}</p>
          <div className="photos">
            {[{ url: t.idPhotoUrl, label: "ID" }, { url: t.profilePhotoUrl, label: "Photo" }, ...t.premisesPhotoUrls.map((url) => ({ url, label: "Premises" }))].map((p) => (
              <a key={p.url} href={p.url} target="_blank" rel="noreferrer" title={p.label}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={p.label} />
                <span className="small muted">{p.label}</span>
              </a>
            ))}
          </div>
          <Link href={`/teachers/${t.id}`} className="small">Preview public page</Link>
        </div>
      ))}
    </div>
  );
}
