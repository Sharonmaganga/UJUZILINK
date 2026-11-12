import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { activeUntil, activeWhere, isActive } from "@/lib/subscription";
import { daysLeft, fmtDate, fmtDateTime } from "@/lib/dates";
import Shell from "@/components/Shell";
import Icon from "@/components/Icon";
import ReviewButtons from "./ReviewButtons";

export const metadata = { title: "Admin · Ujuzi Link" };

type Tab = "queue" | "teachers" | "activity";

const ACTION_LABEL: Record<string, { label: string; tone: string; icon: "check" | "x" | "lock" }> = {
  "teacher.approve": { label: "Approved", tone: "green", icon: "check" },
  "teacher.reject": { label: "Changes requested", tone: "red", icon: "x" },
  "teacher.revoke": { label: "Listing revoked", tone: "red", icon: "lock" },
};

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string; status?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login?callbackUrl=/admin");
  if (session.user.role !== "ADMIN") redirect("/");

  const sp = await searchParams;
  const tab: Tab = sp.tab === "teachers" || sp.tab === "activity" ? sp.tab : "queue";

  const [pendingCount, learners, approved, listed, revenue] = await Promise.all([
    prisma.teacherProfile.count({ where: { status: "PENDING" } }),
    prisma.user.count({ where: { role: "LEARNER" } }),
    prisma.teacherProfile.count({ where: { status: "APPROVED" } }),
    prisma.teacherProfile.count({ where: activeWhere() }),
    prisma.payment.aggregate({ where: { status: "SUCCESS" }, _sum: { amount: true } }),
  ]);

  const items = [
    { key: "queue", href: "/admin", label: "Review queue", icon: "shield" as const, count: pendingCount },
    { key: "teachers", href: "/admin?tab=teachers", label: "Teachers", icon: "users" as const },
    { key: "activity", href: "/admin?tab=activity", label: "Activity log", icon: "history" as const },
  ];

  return (
    <Shell title="Admin" items={items} active={tab}>
      <div className="shell-head">
        <div>
          <h1>{{ queue: "Verification queue", teachers: "Teachers", activity: "Activity log" }[tab]}</h1>
          <p className="muted">
            {{ queue: "Check each document carefully. Approving lists the teacher immediately.", teachers: "Verification and listing status for every teacher.", activity: "Every admin decision and recent payment, newest first." }[tab]}
          </p>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="card tight stat"><span className="label">Awaiting review</span><span className="value">{pendingCount}</span></div>
        <div className="card tight stat"><span className="label">Listed now</span><span className="value">{listed}</span><span className="sub">of {approved} approved</span></div>
        <div className="card tight stat"><span className="label">Learners</span><span className="value">{learners}</span></div>
        <div className="card tight stat"><span className="label">Revenue</span><span className="value">KES {(revenue._sum.amount ?? 0).toLocaleString("en-KE")}</span></div>
      </div>

      {tab === "queue" && <Queue />}
      {tab === "teachers" && <Teachers filter={sp.status} />}
      {tab === "activity" && <Activity />}
    </Shell>
  );
}

async function Queue() {
  const pending = await prisma.teacherProfile.findMany({
    where: { status: "PENDING" },
    include: { user: { select: { name: true, email: true, createdAt: true } } },
    orderBy: { updatedAt: "asc" },
  });

  if (pending.length === 0) {
    return (
      <div className="state">
        <span className="icon-tile"><Icon name="check" /></span>
        <h3>All caught up</h3>
        <p>No profiles are waiting for review.</p>
      </div>
    );
  }

  return (
    <div className="stack-lg">
      {pending.map((t) => {
        const mapUrl = `https://www.google.com/maps?q=${t.latitude},${t.longitude}`;
        return (
          <article key={t.id} className="card review" aria-labelledby={`t-${t.id}`}>
            <div className="row between" style={{ alignItems: "flex-start" }}>
              <div className="row" style={{ alignItems: "center", gap: 14 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.profilePhotoUrl} alt="" className="avatar" />
                <div>
                  <h2 id={`t-${t.id}`} style={{ fontSize: "1.2rem" }}>{t.user.name}</h2>
                  <div className="muted small">
                    {t.skill}{t.businessName ? ` · ${t.businessName}` : ""} · submitted {fmtDate(t.updatedAt)}
                  </div>
                </div>
              </div>
              <ReviewButtons teacherId={t.id} name={t.user.name} actions={["approve", "reject"]} />
            </div>

            <div className="grid-2" style={{ alignItems: "start", gap: 20 }}>
              <dl className="kv">
                <dt>Email</dt><dd>{t.user.email}</dd>
                <dt>Phone</dt><dd>+{t.phone}{t.whatsapp && t.whatsapp !== t.phone ? ` · WA +${t.whatsapp}` : ""}</dd>
                <dt>ID number</dt><dd className="tnum">{t.idNumber}</dd>
                <dt>Account since</dt><dd>{fmtDate(t.user.createdAt)}</dd>
                <dt>Address</dt><dd>{t.address}</dd>
                <dt>Pin</dt>
                <dd>
                  <a className="link" href={mapUrl} target="_blank" rel="noreferrer">
                    {t.latitude.toFixed(5)}, {t.longitude.toFixed(5)} <Icon name="external" />
                  </a>
                </dd>
              </dl>
              <div>
                <div className="label" style={{ marginBottom: 6 }}>Bio</div>
                <p className="small prose" style={{ maxHeight: 180, overflow: "auto" }}>{t.bio}</p>
              </div>
            </div>

            <div>
              <div className="label" style={{ marginBottom: 10 }}>Documents</div>
              <div className="review-docs">
                <div className="doc private">
                  <a href={t.idPhotoUrl} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={t.idPhotoUrl} alt={`ID document for ${t.user.name}`} />
                  </a>
                  <span className="xs"><Icon name="lock" /> ID · admins only</span>
                </div>
                <div className="doc">
                  <a href={t.profilePhotoUrl} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={t.profilePhotoUrl} alt={`Profile photo of ${t.user.name}`} />
                  </a>
                  <span className="xs"><Icon name="user" /> Profile photo</span>
                </div>
                {t.premisesPhotoUrls.map((url, i) => (
                  <div key={url} className="doc">
                    <a href={url} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Premises photo ${i + 1}`} />
                    </a>
                    <span className="xs"><Icon name="store" /> Premises {i + 1}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="row">
              <Link href={`/teachers/${t.id}`} className="btn ghost sm"><Icon name="eye" /> Preview public page</Link>
              <a href={mapUrl} target="_blank" rel="noreferrer" className="btn ghost sm"><Icon name="map" /> Check location</a>
            </div>
          </article>
        );
      })}
    </div>
  );
}

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "APPROVED", label: "Approved" },
  { key: "PENDING", label: "Pending" },
  { key: "REJECTED", label: "Changes needed" },
] as const;

async function Teachers({ filter }: { filter?: string }) {
  const status = STATUS_FILTERS.find((f) => f.key === filter && f.key !== "all")?.key as "APPROVED" | "PENDING" | "REJECTED" | undefined;
  const teachers = await prisma.teacherProfile.findMany({
    where: status ? { status } : {},
    include: {
      user: { select: { name: true, email: true } },
      payments: { where: { status: "SUCCESS" }, orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });
  const now = new Date();

  return (
    <div className="card">
      <div className="chips" style={{ marginBottom: 12 }}>
        {STATUS_FILTERS.map((f) => (
          <Link key={f.key} href={f.key === "all" ? "/admin?tab=teachers" : `/admin?tab=teachers&status=${f.key}`} className={`chip${(status ?? "all") === f.key ? " active" : ""}`}>
            {f.label}
          </Link>
        ))}
      </div>
      {teachers.length === 0 ? (
        <p className="muted" style={{ margin: 0 }}>No teachers here.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Teacher</th><th>Skill</th><th>Verification</th><th>Listing</th><th>Last payment</th><th><span className="sr-only">Actions</span></th></tr>
            </thead>
            <tbody>
              {teachers.map((t) => {
                const until = activeUntil(t);
                const live = t.status === "APPROVED" && isActive(t, now);
                const trial = !!t.trialEndsAt && t.trialEndsAt > now && !(t.paidUntil && t.paidUntil > t.trialEndsAt);
                return (
                  <tr key={t.id}>
                    <td>
                      <Link href={`/teachers/${t.id}`} className="strong">{t.user.name}</Link>
                      <div className="xs muted">{t.user.email}</div>
                    </td>
                    <td>{t.skill}</td>
                    <td>
                      <span className={`badge ${{ APPROVED: "green", PENDING: "amber", REJECTED: "red", INCOMPLETE: "" }[t.status]}`}>
                        {{ APPROVED: "Approved", PENDING: "Pending", REJECTED: "Changes needed", INCOMPLETE: "Incomplete" }[t.status]}
                      </span>
                      {t.status === "REJECTED" && t.rejectionReason && <div className="xs muted" style={{ maxWidth: 220 }}>{t.rejectionReason}</div>}
                    </td>
                    <td>
                      {live && until ? (
                        <>
                          <span className="badge dark">{trial ? "Trial" : "Paid"}</span>
                          <div className="xs muted tnum">{daysLeft(until, now)} days · to {fmtDate(until)}</div>
                        </>
                      ) : until ? (
                        <><span className="badge">Hidden</span><div className="xs muted">{until < now ? `Expired ${fmtDate(until)}` : "Not approved"}</div></>
                      ) : (
                        <span className="muted xs">Not started</span>
                      )}
                    </td>
                    <td className="tnum small">{t.payments[0] ? `${fmtDate(t.payments[0].createdAt)} · ${t.payments[0].mpesaReceipt ?? ""}` : "–"}</td>
                    <td>
                      <ReviewButtons
                        teacherId={t.id}
                        name={t.user.name}
                        actions={t.status === "APPROVED" ? ["revoke"] : t.status === "PENDING" ? ["approve", "reject"] : t.status === "REJECTED" ? ["approve"] : []}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

async function Activity() {
  const [logs, payments] = await Promise.all([
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { actor: { select: { name: true } } } }),
    prisma.payment.findMany({ orderBy: { createdAt: "desc" }, take: 30, include: { teacher: { select: { id: true, user: { select: { name: true } } } } } }),
  ]);
  const targets = await prisma.teacherProfile.findMany({
    where: { id: { in: [...new Set(logs.map((l) => l.targetId))] } },
    select: { id: true, user: { select: { name: true } } },
  });
  const nameOf = new Map(targets.map((t) => [t.id, t.user.name]));

  return (
    <div className="grid-2" style={{ alignItems: "start" }}>
      <section className="card" aria-labelledby="audit-h">
        <div className="card-head"><h2 id="audit-h">Admin decisions</h2><span className="muted small">Last 100</span></div>
        {logs.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>No decisions recorded yet.</p>
        ) : (
          <ul className="feed">
            {logs.map((l) => {
              const a = ACTION_LABEL[l.action] ?? { label: l.action, tone: "", icon: "check" as const };
              return (
                <li key={l.id}>
                  <span className={`icon-tile sm${a.tone === "red" ? " amber" : ""}`}><Icon name={a.icon} /></span>
                  <div className="small">
                    <strong>{a.label}</strong>{" · "}
                    <Link href={`/teachers/${l.targetId}`} className="link">{nameOf.get(l.targetId) ?? "Deleted teacher"}</Link>
                    <div className="muted">by {l.actor?.name ?? "deleted admin"}{l.detail ? ` · ${l.detail}` : ""}</div>
                  </div>
                  <time className="xs muted tnum" dateTime={l.createdAt.toISOString()}>{fmtDateTime(l.createdAt)}</time>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <section className="card" aria-labelledby="payments-h">
        <div className="card-head"><h2 id="payments-h">Recent payments</h2><span className="muted small">M-Pesa</span></div>
        {payments.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>No payments yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>When</th><th>Teacher</th><th>Status</th><th>Receipt</th></tr></thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="tnum xs">{fmtDateTime(p.createdAt)}</td>
                    <td className="small">{p.teacher.user.name}</td>
                    <td><span className={`badge ${{ SUCCESS: "green", FAILED: "red", CANCELLED: "", PENDING: "amber" }[p.status]}`} title={p.resultDesc ?? undefined}>{p.status.toLowerCase()}</span></td>
                    <td className="tnum xs">{p.mpesaReceipt ?? "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
