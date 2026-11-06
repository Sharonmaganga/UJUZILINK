import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { activeUntil, isActive, PRICE_KES, TRIAL_DAYS } from "@/lib/subscription";
import PayButton from "./PayButton";

const fmt = (d: Date) => d.toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" });

export default async function Dashboard() {
  const session = await getSession();
  if (!session) redirect("/login?callbackUrl=/dashboard");
  if (session.user.role !== "TEACHER") redirect("/search");

  const teacher = await prisma.teacherProfile.findUnique({
    where: { userId: session.user.id },
    include: { payments: { orderBy: { createdAt: "desc" }, take: 10 } },
  });

  if (!teacher) {
    return (
      <div className="card stack narrow">
        <h1>Welcome, {session.user.name}</h1>
        <p>To be featured to learners you need a verified profile. You&apos;ll need:</p>
        <ul>
          <li>A valid national ID or passport (photo of it)</li>
          <li>A clear photo of yourself</li>
          <li>Photos of your premises or place of trade</li>
          <li>Your location pinned on the map</li>
        </ul>
        <div>
          <Link href="/dashboard/profile" className="btn">
            Set up my teacher profile
          </Link>
        </div>
      </div>
    );
  }

  const until = activeUntil(teacher);
  const active = isActive(teacher);
  const inTrial = !!teacher.trialEndsAt && teacher.trialEndsAt > new Date() && !(teacher.paidUntil && teacher.paidUntil > teacher.trialEndsAt);

  return (
    <div className="stack">
      <h1>My dashboard</h1>

      <div className="card stack">
        <h2>Verification</h2>
        {teacher.status === "PENDING" && (
          <div className="alert info">
            Your documents are being reviewed. We&apos;ll feature you once they&apos;re approved, and your {TRIAL_DAYS}-day
            free trial will start then.
          </div>
        )}
        {teacher.status === "APPROVED" && <div className="alert ok">Your profile is verified.</div>}
        {teacher.status === "REJECTED" && (
          <div className="alert">
            Your profile was not approved: {teacher.rejectionReason}. Please update it and submit again.
          </div>
        )}
        <div className="row">
          <Link href="/dashboard/profile" className="btn secondary">
            Edit profile
          </Link>
          <Link href={`/teachers/${teacher.id}`}>View my public page</Link>
        </div>
      </div>

      {teacher.status === "APPROVED" && (
        <div className="card stack">
          <h2>Subscription</h2>
          {active && until ? (
            <p>
              <span className="badge green">Featured</span> You are visible to learners until <strong>{fmt(until)}</strong>
              {inTrial ? " (free trial)" : ""}.
            </p>
          ) : (
            <p>
              <span className="badge red">Not featured</span> Your subscription has ended, so learners can&apos;t find you.
              Pay KES {PRICE_KES} to be featured for another 30 days.
            </p>
          )}
          <p className="small muted">Each payment adds 30 days, starting from when your current time runs out.</p>
          <PayButton defaultPhone={`0${teacher.phone.slice(3)}`} price={PRICE_KES} />
        </div>
      )}

      {teacher.payments.length > 0 && (
        <div className="card">
          <h2>Payments</h2>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {teacher.payments.map((p) => (
                  <tr key={p.id}>
                    <td>{fmt(p.createdAt)}</td>
                    <td>KES {p.amount}</td>
                    <td>
                      <span className={`badge ${p.status === "SUCCESS" ? "green" : p.status === "FAILED" ? "red" : "amber"}`}>
                        {p.status.toLowerCase()}
                      </span>
                    </td>
                    <td>{p.mpesaReceipt ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
