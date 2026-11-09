import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isActive } from "@/lib/subscription";
import { teacherTitle } from "@/components/TeacherCard";
import Icon from "@/components/Icon";

export default async function TeacherPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [teacher, session] = await Promise.all([
    prisma.teacherProfile.findUnique({ where: { id }, include: { user: { select: { name: true } } } }),
    getSession(),
  ]);
  const isOwner = !!session && teacher?.userId === session.user.id;
  const isAdmin = session?.user.role === "ADMIN";
  const isPublic = !!teacher && teacher.status === "APPROVED" && isActive(teacher);
  if (!teacher || (!isPublic && !isOwner && !isAdmin)) notFound();

  const signedIn = !!session;
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${teacher.latitude},${teacher.longitude}`;
  const wa = teacher.whatsapp ?? teacher.phone;
  const first = teacher.user.name.split(" ")[0];
  const cover = teacher.premisesPhotoUrls[0];
  const title = teacherTitle({ businessName: teacher.businessName, skill: teacher.skill, name: teacher.user.name });
  const verified = teacher.status === "APPROVED";
  const back = `/teachers/${teacher.id}`;

  return (
    <div className="container page has-mobile-cta">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <Icon name="chevronRight" />
        <Link href="/search">Teachers</Link>
        <Icon name="chevronRight" />
        <Link href={`/search?q=${encodeURIComponent(teacher.skill)}`}>{teacher.skill}</Link>
      </nav>

      {!isPublic && (
        <div className="alert warn" style={{ marginBottom: 16 }}>
          <Icon name="lock" />
          <div>
            <strong>Not visible to learners</strong>
            <p>
              {teacher.status !== "APPROVED"
                ? "This profile is waiting for verification. Only you and the Ujuzi Link team can see it."
                : "The listing period has ended. Renew from the dashboard to appear in search again."}
            </p>
          </div>
        </div>
      )}

      <div className="profile-cover">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={`${teacher.user.name}'s place of trade`} />
        ) : (
          <div className="arch-mini" aria-hidden />
        )}
      </div>

      <div className="profile-head">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={teacher.profilePhotoUrl} alt={teacher.user.name} className="avatar xl" />
        <div className="profile-head-text">
          <div className="row" style={{ gap: 8 }}>
            {verified && (
              <span className="badge green">
                <Icon name="shield" /> ID verified
              </span>
            )}
            <span className="badge">{teacher.skill}</span>
          </div>
          <h1>{title}</h1>
          <div className="muted">
            {teacher.user.name} · {teacher.skill} teacher
          </div>
        </div>
      </div>

      <div className="profile-layout">
        <div className="stack-lg">
          <section className="card" aria-labelledby="about-h">
            <h2 id="about-h" style={{ marginBottom: 14 }}>About {first}</h2>
            <p className="prose">{teacher.bio}</p>
            <div style={{ marginTop: 20 }}>
              <div className="label" style={{ marginBottom: 10 }}>Skills taught</div>
              <div className="chips wrap">
                <Link href={`/search?q=${encodeURIComponent(teacher.skill)}`} className="chip active">{teacher.skill}</Link>
                {teacher.otherSkills.map((s) => (
                  <Link key={s} href={`/search?q=${encodeURIComponent(s)}`} className="chip" style={{ textTransform: "capitalize" }}>
                    {s}
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {teacher.premisesPhotoUrls.length > 0 && (
            <section className="card" aria-labelledby="gallery-h">
              <div className="card-head">
                <h2 id="gallery-h">Place of trade & work</h2>
                <span className="muted small">{teacher.premisesPhotoUrls.length} photo{teacher.premisesPhotoUrls.length === 1 ? "" : "s"}</span>
              </div>
              <div className="gallery">
                {teacher.premisesPhotoUrls.map((url, i) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer" aria-label={`Open photo ${i + 1} of ${teacher.premisesPhotoUrls.length}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`${first}'s place of trade, photo ${i + 1}`} loading="lazy" />
                  </a>
                ))}
              </div>
            </section>
          )}

          <section className="card" aria-labelledby="where-h">
            <h2 id="where-h" style={{ marginBottom: 16 }}>Where you&apos;ll learn</h2>
            <div className="loc-card">
              <span className="icon-tile"><Icon name="pin" /></span>
              <div className="stack-sm grow">
                <strong>{teacher.address}</strong>
                {signedIn ? (
                  <>
                    <span className="muted small">The exact pin was confirmed during verification.</span>
                    <div>
                      <a className="btn secondary sm" href={directions} target="_blank" rel="noreferrer">
                        <Icon name="navigation" /> Get directions
                      </a>
                    </div>
                  </>
                ) : (
                  <span className="muted small">
                    The exact pin and directions are shown to signed-in members.{" "}
                    <Link href={`/login?callbackUrl=${back}`} className="link">Log in</Link>
                  </span>
                )}
              </div>
            </div>
          </section>

          <section className="card soft" aria-labelledby="safety-h">
            <h2 id="safety-h" style={{ marginBottom: 16 }}>Learning safely</h2>
            <ul className="checks">
              <li><Icon name="check" /> {verified ? `${first}'s ID, photo and premises were checked by the Ujuzi Link team.` : "This profile has not been verified yet."}</li>
              <li><Icon name="check" /> Meet at the place of trade shown above, ideally during working hours.</li>
              <li><Icon name="check" /> Agree on what you&apos;ll learn and the price before you start, then pay {first} directly.</li>
              <li><Icon name="check" /> Ujuzi Link never asks you to pay through the app.</li>
            </ul>
          </section>
        </div>

        <aside className="profile-aside">
          <div className="card contact-card">
            <span className="muted small">Learn {teacher.skill.toLowerCase()} with {teacher.user.name}</span>
            <div className="contact-free">Free to contact</div>
            <span className="muted small" style={{ marginTop: -6 }}>Agree the price with {first} and pay them directly.</span>
            <hr className="divider" />
            {signedIn ? (
              <>
                <a className="btn lg block" href={`tel:+${teacher.phone}`}>
                  <Icon name="phone" /> Call +{teacher.phone}
                </a>
                <a className="btn secondary block" href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer">
                  <Icon name="chat" /> WhatsApp {first}
                </a>
              </>
            ) : (
              <>
                <Link className="btn lg block" href={`/register?callbackUrl=${back}`}>
                  Join free to contact {first}
                </Link>
                <p className="small muted" style={{ margin: 0, textAlign: "center" }}>
                  Already a member? <Link href={`/login?callbackUrl=${back}`} className="link">Log in</Link>
                </p>
              </>
            )}
            <ul className="checks small" style={{ marginTop: 6 }}>
              <li><Icon name="lock" /> Phone and WhatsApp visible to members only</li>
              <li><Icon name="check" /> No fees for learners, ever</li>
            </ul>
          </div>
        </aside>
      </div>

      <div className="mobile-cta">
        {signedIn ? (
          <>
            <a className="btn" href={`tel:+${teacher.phone}`}><Icon name="phone" /> Call</a>
            <a className="btn secondary" href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer"><Icon name="chat" /> WhatsApp</a>
          </>
        ) : (
          <Link className="btn" href={`/register?callbackUrl=${back}`}>Join free to contact {first}</Link>
        )}
      </div>
    </div>
  );
}
