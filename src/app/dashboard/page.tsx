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

  const teacher = await prisma.teacherProfile.findUnique({
    where: { userId: session.user.id },
    include: { payments: { orderBy: { createdAt: "desc" }, take: 12 } },
  });
  const first = session.user.name?.split(" ")[0] ?? "there";

  if (!teacher) {
    return (
      <Shell title="Your workspace" items={teacherNav()} active="overview">
        <div className="shell-head">
          <div>
            <h1>Welcome, {first}</h1>
            <p className="muted">Set up your profile to be listed for learners near you.</p>
          </div>
        </div>
        <div className="grid-2" style={{ alignItems: "start" }}>
          <div className="card stack">
            <span className="icon-tile amber"><Icon name="shield" /></span>
            <h2>Get verified in one go</h2>
            <p className="muted" style={{ margin: 0 }}>Have these ready. It takes about 10 minutes on your phone.</p>
            <ul className="checklist">
              <li><span className="tick" /> Your national ID or passport (and a photo of it)</li>
              <li><span className="tick" /> A clear photo of yourself</li>
              <li><span className="tick" /> 1–6 photos of your premises or work</li>
              <li><span className="tick" /> Your place of trade pinned on the map</li>
            </ul>
            <div>
              <Link href="/dashboard/profile" className="btn lg">
                Set up my teacher profile <Icon name="arrow" />
              </Link>
            </div>
          </div>
          <div className="card soft stack">
            <h3>What happens next</h3>
            <ol className="timeline">
              <li className="current"><span className="tl-dot">1</span><div><strong>Submit your profile</strong><span className="d">ID, photos and location</span></div></li>
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

  // Required items are enforced by the API; recommended ones make a profile more convincing.
  const recommended = [
    { label: "3 or more premises / work photos", ok: teacher.premisesPhotoUrls.length >= 3 },
    { label: "A detailed bio (120+ characters)", ok: teacher.bio.length >= 120 },
    { label: "Other skills you teach", ok: teacher.otherSkills.length > 0 },
    { label: "Business name", ok: !!teacher.businessName },
    { label: "WhatsApp number", ok: !!teacher.whatsapp },
  ];
  const required = [
    { label: "Skill and bio", ok: !!teacher.skill && teacher.bio.length >= 20 },
    { label: "Phone number", ok: !!teacher.phone },
    { label: "Location pinned", ok: Number.isFinite(teacher.latitude) },
    { label: "ID number and photo", ok: !!teacher.idNumber && !!teacher.idPhotoUrl },
    { label: "Profile photo", ok: !!teacher.profilePhotoUrl },
    { label: "Premises photo", ok: teacher.premisesPhotoUrls.length > 0 },
  ];
  const all = [...required, ...recommended];
  const pct = Math.round((all.filter((i) => i.ok).length / all.length) * 100);

  const verifyStep = (s: "submitted" | "review" | "done") => {
    const order = { PENDING: 1, APPROVED: 2, REJECTED: 1, INCOMPLETE: 0 }[teacher.status];
    const idx = { submitted: 0, review: 1, done: 2 }[s];
    if (teacher.status === "REJECTED" && idx === 1) return "failed";
    return idx < order || (idx === 2 && approved) ? "done" : idx === order ? "current" : "";
  };

  return (
    <Shell title="Your workspace" items={teacherNav(teacher.id)} active="overview">
      <div className="shell-head">
        <div>
          <h1>Hello, {first}</h1>
          <p className="muted">Manage your profile, verification and listing.</p>
        </div>
        <div className="row">
          <Link href={`/teachers/${teacher.id}`} className="btn secondary sm"><Icon name="eye" /> View public page</Link>
          <Link href="/dashboard/profile" className="btn sm"><Icon name="user" /> Edit profile</Link>
        </div>
      </div>

      {teacher.status === "REJECTED" && (
        <div className="alert" style={{ marginBottom: 20 }}>
          <Icon name="alert" />
          <div>
            <strong>Your profile needs changes</strong>
            <p>{teacher.rejectionReason ?? "Your documents could not be verified."} Update your profile and it will go back for review.</p>
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

      <div className="grid-4" style={{ marginBottom: 16 }}>
        <div className="card tight stat">
          <span className="label">Verification</span>
          <span className="value" style={{ fontSize: "1.25rem" }}>
            {{ APPROVED: "Approved", PENDING: "In review", REJECTED: "Changes needed", INCOMPLETE: "Incomplete" }[teacher.status]}
          </span>
          <span className="sub">{approved && teacher.verifiedAt ? `Since ${fmtDate(teacher.verifiedAt)}` : "Reviewed by our team"}</span>
        </div>
        <div className="card tight stat">
          <span className="label">Plan</span>
          <span className="value" style={{ fontSize: "1.25rem" }}>{!approved ? "Not started" : active ? (inTrial ? "Free trial" : "Paid") : "Expired"}</span>
          <span className="sub">{approved && until ? `${active ? "Until" : "Ended"} ${fmtDate(until)}` : `Starts on approval`}</span>
        </div>
        <div className="card tight stat">
          <span className="label">Days left</span>
          <span className="value">{approved ? left : "–"}</span>
          <span className="sub">{inTrial ? "of your free month" : "on your listing"}</span>
        </div>
        <div className="card tight stat">
          <span className="label">Listing</span>
          <span className="value" style={{ fontSize: "1.25rem" }}>{approved && active ? "Live in search" : "Hidden"}</span>
          <span className="sub">{approved && active ? "Learners can find you" : "Not shown to learners"}</span>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: "start", marginBottom: 16 }}>
        <section className="card" aria-labelledby="complete-h">
          <div className="card-head">
            <div>
              <h2 id="complete-h">Profile strength</h2>
              <p className="muted small" style={{ margin: "4px 0 0" }}>Complete profiles get more calls.</p>
            </div>
            <strong className="tnum" style={{ fontSize: "1.4rem", color: "var(--forest)" }}>{pct}%</strong>
          </div>
          <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Profile completion">
            <span style={{ width: `${pct}%` }} />
          </div>
          <ul className="checklist" style={{ marginTop: 18 }}>
            {all.map((i) => (
              <li key={i.label} className={i.ok ? "ok" : ""}>
                <span className="tick"><Icon name="check" /></span>
                {i.label}
              </li>
            ))}
          </ul>
          {pct < 100 && (
            <Link href="/dashboard/profile" className="btn secondary sm" style={{ marginTop: 18 }}>
              Improve profile
            </Link>
          )}
        </section>

        <section className="card" aria-labelledby="verify-h">
          <div className="card-head">
            <h2 id="verify-h">Verification</h2>
            <span className={`badge ${approved ? "green" : teacher.status === "REJECTED" ? "red" : "amber"}`}>
              {approved ? <><Icon name="shield" /> Verified</> : teacher.status === "REJECTED" ? "Changes needed" : "In review"}
            </span>
          </div>
          <ol className="timeline">
            <li className={verifyStep("submitted")}>
              <span className="tl-dot"><Icon name="check" /></span>
              <div><strong>Documents submitted</strong><span className="d">Last updated {fmtDate(teacher.updatedAt)}</span></div>
            </li>
            <li className={verifyStep("review")}>
              <span className="tl-dot">{teacher.status === "REJECTED" ? <Icon name="x" /> : <Icon name="eye" />}</span>
              <div>
                <strong>{teacher.status === "REJECTED" ? "Changes requested" : "Reviewed by our team"}</strong>
                <span className="d">{teacher.status === "PENDING" ? "Usually within 2 working days" : teacher.status === "REJECTED" ? "Fix and resubmit from My profile" : "ID, photos and location checked"}</span>
              </div>
            </li>
            <li className={verifyStep("done")}>
              <span className="tl-dot"><Icon name="shield" /></span>
              <div><strong>Approved and listed</strong><span className="d">{approved ? `Free trial ${teacher.trialEndsAt ? `until ${fmtDate(teacher.trialEndsAt)}` : "started"}` : `${TRIAL_DAYS} days free start here`}</span></div>
            </li>
          </ol>
          <hr className="divider" style={{ margin: "20px 0 16px" }} />
          <div className="label" style={{ marginBottom: 10 }}>Documents on file</div>
          <ul className="checklist">
            <li className={teacher.idPhotoUrl ? "ok" : ""}><span className="tick"><Icon name="check" /></span> ID photo <span className="badge" style={{ marginLeft: "auto" }}><Icon name="lock" /> Admins only</span></li>
            <li className={teacher.profilePhotoUrl ? "ok" : ""}><span className="tick"><Icon name="check" /></span> Profile photo</li>
            <li className={teacher.premisesPhotoUrls.length ? "ok" : ""}><span className="tick"><Icon name="check" /></span> {teacher.premisesPhotoUrls.length} premises photo{teacher.premisesPhotoUrls.length === 1 ? "" : "s"}</li>
          </ul>
        </section>
      </div>

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
