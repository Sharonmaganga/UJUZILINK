import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { activeUntil, isActive, PRICE_KES, TRIAL_DAYS, PERIOD_DAYS } from "@/lib/subscription";
import { daysLeft, fmtDate } from "@/lib/dates";
import Shell, { teacherNav } from "@/components/Shell";
import Icon from "@/components/Icon";
import PayButton from "./PayButton";

export const metadata = { title: "Teacher workspace · Ujuzi Link" };

const PAY_BADGE = { SUCCESS: "green", FAILED: "red", CANCELLED: "", PENDING: "amber" } as const;
const PAY_LABEL = { SUCCESS: "Paid", FAILED: "Failed", CANCELLED: "Cancelled", PENDING: "Pending" } as const;

export default async function Dashboard() {
  const session = await getSession();
  if (!session) redirect("/login?callbackUrl=/dashboard");
  if (session.user.role !== "TEACHER") redirect(session.user.role === "ADMIN" ? "/admin" : "/search");

  const [teacher, draft] = await Promise.all([
    prisma.teacherProfile.findUnique({
      where: { userId: session.user.id },
      include: { payments: { orderBy: { createdAt: "desc" }, take: 12 } },
    }),
    prisma.teacherDraft.findUnique({ where: { userId: session.user.id }, select: { updatedAt: true } }),
  ]);
  const first = session.user.name?.split(" ")[0] ?? "there";

  if (!teacher) {
    return (
      <Shell title="Teacher workspace" items={teacherNav()} active="overview">
        <div className="shell-head">
          <div>
            <h1>Welcome, {first}</h1>
            <p className="muted">Get verified to be listed for learners near you.</p>
          </div>
        </div>
        <div className="grid-2" style={{ alignItems: "start" }}>
          <div className="card stack">
            <span className="icon-tile amber"><Icon name="shield" /></span>
            <h2>{draft ? "Continue your verification" : "Get verified in five short steps"}</h2>
            <p className="muted" style={{ margin: 0 }}>
              {draft ? `Your progress was saved on ${fmtDate(draft.updatedAt)}. Pick up where you left off.` : "Have these ready. It takes about 10 minutes on your phone."}
            </p>
            <ul className="checklist">
              <li><span className="tick" /> Your national ID or passport (and a photo of it)</li>
              <li><span className="tick" /> A clear photo of yourself</li>
              <li><span className="tick" /> Your place of trade pinned on the map</li>
              <li><span className="tick" /> 1–6 photos of your premises or work</li>
            </ul>
            <div>
              <Link href="/dashboard/profile" className="btn lg">
                {draft ? "Continue where I left off" : "Start verification"} <Icon name="arrow" />
              </Link>
            </div>
          </div>
          <div className="card soft stack">
            <h3>What happens next</h3>
            <ol className="timeline">
              <li className="current"><span className="tl-dot">1</span><div><strong>Submit your profile</strong><span className="d">Details, ID, location and photos</span></div></li>
              <li><span className="tl-dot">2</span><div><strong>We review it</strong><span className="d">Usually within 2 working days</span></div></li>
              <li><span className="tl-dot">3</span><div><strong>{TRIAL_DAYS} days free</strong><span className="d">Your listing goes live on approval</span></div></li>
            </ol>
          </div>
        </div>
      </Shell>
    );
  }

  const now = new Date();
  const until = activeUntil(teacher);
  const active = isActive(teacher, now);
  const inTrial = !!teacher.trialEndsAt && teacher.trialEndsAt > now && !(teacher.paidUntil && teacher.paidUntil > teacher.trialEndsAt);
  const left = daysLeft(until, now);
  const approved = teacher.status === "APPROVED";
  const live = approved && active;

  // Required items are enforced at submission; recommended ones make a profile more convincing.
  const items = [
    { label: "Skill, introduction and phone", ok: !!teacher.skill && teacher.bio.length >= 20 && !!teacher.phone },
    { label: "ID and profile photo", ok: !!teacher.idPhotoUrl && !!teacher.profilePhotoUrl },
    { label: "Location pinned", ok: Number.isFinite(teacher.latitude) },
    { label: "Premises photo", ok: teacher.premisesPhotoUrls.length > 0 },
    { label: "3 or more work photos", ok: teacher.premisesPhotoUrls.length >= 3 },
    { label: "Detailed introduction (120+ characters)", ok: teacher.bio.length >= 120 },
    { label: "Other skills", ok: teacher.otherSkills.length > 0 },
    { label: "Business name", ok: !!teacher.businessName },
    { label: "WhatsApp number", ok: !!teacher.whatsapp },
  ];
  const pct = Math.round((items.filter((i) => i.ok).length / items.length) * 100);
  const nextFix = items.find((i) => !i.ok);

  const ready = [
    {
      ok: approved,
      text: approved ? "Identity and premises approved" : teacher.status === "REJECTED" ? `Changes requested: ${teacher.rejectionReason ?? "see your profile"}` : "Identity and premises under review",
      href: "/dashboard/profile?step=5",
    },
    { ok: live, text: live ? "Listing visible to nearby learners" : approved ? "Listing hidden: renew to be visible again" : "Listing goes live once you're approved", href: "#subscription" },
    { ok: teacher.premisesPhotoUrls.length >= 3, text: teacher.premisesPhotoUrls.length >= 3 ? `${teacher.premisesPhotoUrls.length} work photos on your profile` : "Add more work photos to strengthen your profile", href: "/dashboard/profile?step=4" },
    { ok: !!teacher.whatsapp, text: teacher.whatsapp ? "WhatsApp contact added" : "Add a WhatsApp number so learners can message you", href: "/dashboard/profile?step=1" },
  ];

  return (
    <Shell title="Teacher workspace" items={teacherNav(teacher.id)} active="overview">
      <div className="shell-head">
        <div>
          <h1>Teacher workspace</h1>
          <p className="muted">Manage your profile, verification and listing.</p>
        </div>
        <Link href={`/teachers/${teacher.id}`} className="btn secondary sm">
          Preview profile <Icon name="arrowUpRight" />
        </Link>
      </div>

      {teacher.status === "REJECTED" && (
        <div className="alert" style={{ marginBottom: 20 }}>
          <Icon name="alert" />
          <div>
            <strong>Your profile needs changes</strong>
            <p>{teacher.rejectionReason ?? "Your documents could not be verified."} <Link href="/dashboard/profile?step=1" className="link">Update and resubmit</Link></p>
          </div>
        </div>
      )}
      {approved && !active && (
        <div className="alert warn" style={{ marginBottom: 20 }}>
          <Icon name="clock" />
          <div>
            <strong>Your listing has ended</strong>
            <p>Learners can&apos;t find you right now. Renew below to be listed for another {PERIOD_DAYS} days.</p>
          </div>
        </div>
      )}

      <div className="grid-3" style={{ marginBottom: 16 }}>
        <div className="card tight stat">
          <span className="label">Verification</span>
          <span className={`value tone-text ${approved ? "" : teacher.status === "REJECTED" ? "bad" : "wait"}`}>
            {{ APPROVED: "Approved", PENDING: "In review", REJECTED: "Changes needed", INCOMPLETE: "Incomplete" }[teacher.status]}
          </span>
          <span className="sub">{approved ? <><Icon name="check" /> Profile reviewed{teacher.verifiedAt ? ` · ${fmtDate(teacher.verifiedAt)}` : ""}</> : "Reviewed by our team"}</span>
        </div>
        <div className="card tight stat">
          <span className="label">Subscription</span>
          <span className={`value tone-text ${!approved ? "wait" : active ? "" : "bad"}`}>{!approved ? "Not started" : active ? (inTrial ? "Free trial" : "Paid") : "Expired"}</span>
          <span className="sub">{!approved ? `${TRIAL_DAYS} days free on approval` : active ? `${left} day${left === 1 ? "" : "s"} remaining` : until ? `Ended ${fmtDate(until)}` : ""}</span>
        </div>
        <div className="card tight stat">
          <span className="label">Visibility</span>
          <span className={`value tone-text ${live ? "" : "wait"}`}>{live ? "Featured" : "Hidden"}</span>
          <span className="sub">{live ? "Visible to learners" : "Not shown in search"}</span>
        </div>
      </div>

      <div className="dash-row" style={{ marginBottom: 16 }}>
        <section className="card" aria-labelledby="complete-h">
          <h2 id="complete-h">Your profile</h2>
          <p className="muted small" style={{ margin: "4px 0 18px" }}>Help learners understand what you teach.</p>
          <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Profile completion">
            <span style={{ width: `${pct}%` }} />
          </div>
          <p className="strong small" style={{ color: "var(--forest)", margin: "10px 0 16px" }}>
            {pct}% complete{nextFix ? <span className="muted" style={{ fontWeight: 500 }}> · Next: {nextFix.label.toLowerCase()}</span> : null}
          </p>
          <Link href="/dashboard/profile?step=1" className="btn sm">
            {pct < 100 ? "Complete profile" : "Edit profile"} <Icon name="arrow" />
          </Link>
        </section>

        <section className="card" aria-labelledby="renew-h">
          <span className="muted small" id="renew-h">Your next renewal</span>
          <div className="price" style={{ fontSize: "2.2rem", margin: "6px 0 4px", color: "var(--ink)" }}>KES {PRICE_KES}</div>
          <p className="muted small" style={{ margin: "0 0 16px" }}>
            {approved && until && active ? `Due ${fmtDate(until)} · every ${PERIOD_DAYS} days after your trial.` : `Every ${PERIOD_DAYS} days after your trial.`}
          </p>
          {approved ? (
            <a href="#subscription" className="btn sm">Pay with M-Pesa <Icon name="arrow" /></a>
          ) : (
            <span className="badge">Available after approval</span>
          )}
        </section>
      </div>

      <section className="card" aria-labelledby="ready-h" style={{ marginBottom: 16 }}>
        <h2 id="ready-h" style={{ marginBottom: 16 }}>Keep your listing ready</h2>
        <ul className="ready-list">
          {ready.map((r) => (
            <li key={r.text} className={r.ok ? "ok" : ""}>
              <span className="tick">{r.ok ? <Icon name="check" /> : null}</span>
              {r.ok ? <span>{r.text}</span> : <Link href={r.href}>{r.text}</Link>}
            </li>
          ))}
        </ul>
      </section>

      <section id="subscription" className="card" aria-labelledby="sub-h" style={{ marginBottom: 16 }}>
        <div className="grid-2" style={{ gap: 28 }}>
          <div className="stack">
            <div>
              <h2 id="sub-h">Subscription</h2>
              <p className="muted small" style={{ margin: "4px 0 0" }}>KES {PRICE_KES} keeps you listed for {PERIOD_DAYS} days.</p>
            </div>
            {approved ? (
              <>
                <div className="row" style={{ alignItems: "baseline" }}>
                  <span className="price">{left}</span>
                  <span className="muted">day{left === 1 ? "" : "s"} left{inTrial ? " in your free trial" : ""}</span>
                </div>
                {until && (
                  <div className="progress amber" aria-hidden>
                    <span style={{ width: `${Math.min(100, (left / (inTrial ? TRIAL_DAYS : PERIOD_DAYS)) * 100)}%` }} />
                  </div>
                )}
                <p className="small muted" style={{ margin: 0 }}>
                  Paying adds {PERIOD_DAYS} days to the end of your current period, or starts a new one today if it has ended. You never lose days.
                </p>
              </>
            ) : (
              <div className="alert info">
                <Icon name="info" />
                <p style={{ margin: 0 }}>Your free {TRIAL_DAYS}-day listing starts when your profile is approved. Payments open after that.</p>
              </div>
            )}
          </div>
          {approved && <PayButton defaultPhone={`0${teacher.phone.slice(3)}`} price={PRICE_KES} />}
        </div>
      </section>

      <section id="payments" className="card" aria-labelledby="pay-h">
        <div className="card-head">
          <h2 id="pay-h">Payment history</h2>
          <span className="muted small">M-Pesa</span>
        </div>
        {teacher.payments.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>No payments yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Date</th><th>Amount</th><th>Phone</th><th>Status</th><th>Receipt</th></tr>
              </thead>
              <tbody>
                {teacher.payments.map((p) => (
                  <tr key={p.id}>
                    <td className="tnum">{fmtDate(p.createdAt)}</td>
                    <td className="tnum">KES {p.amount}</td>
                    <td className="tnum">+{p.phone}</td>
                    <td>
                      <span className={`badge ${PAY_BADGE[p.status]}`} title={p.resultDesc ?? undefined}>{PAY_LABEL[p.status]}</span>
                    </td>
                    <td className="tnum">{p.mpesaReceipt ?? "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </Shell>
  );
}
