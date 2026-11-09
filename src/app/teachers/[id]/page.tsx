import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isActive } from "@/lib/subscription";
import { areaLabel } from "@/lib/places";
import { categoryForSkill, categoryHref } from "@/lib/skills";
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
  const name = teacher.user.name;
  const first = name.split(" ")[0];
  const cover = teacher.premisesPhotoUrls[0];
  const verified = teacher.status === "APPROVED";
  const back = `/teachers/${teacher.id}`;
  const area = areaLabel(teacher.latitude, teacher.longitude);
  const cat = categoryForSkill(teacher.skill);

  return (
    <div className="container page has-mobile-cta">
      <Link href={cat ? categoryHref(cat) : "/search"} className="back-link">
        <Icon name="arrowLeft" /> Back to search
      </Link>

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
          <img src={cover} alt={`${first}'s place of trade`} />
        ) : (
          <div className="cover-art" aria-hidden><span /></div>
        )}
      </div>

      <div className="profile-head">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={teacher.profilePhotoUrl} alt={name} className="avatar xl" />
        <div className="profile-head-text">
          <h1>{name}</h1>
          <div className="profile-meta">
            <span className="strong">{teacher.skill}{teacher.businessName ? ` · ${teacher.businessName}` : ""}</span>
            <span className="muted"><Icon name="pin" /> {area}</span>
            <span className="muted">Practical, hands-on teaching</span>
          </div>
        </div>
        {verified && (
          <span className="badge green profile-verified">
            <Icon name="check" /> Verified
          </span>
        )}
      </div>

      <div className="profile-layout">
        <div className="stack-lg">
          <section className="card" aria-labelledby="about-h">
            <h2 id="about-h" style={{ marginBottom: 14 }}>About the teacher</h2>
            <p className="prose muted-ink">{teacher.bio}</p>
            <div style={{ marginTop: 22 }}>
              <div className="label" style={{ marginBottom: 10 }}>Skills taught</div>
              <div className="chips wrap">
                <Link href={cat ? categoryHref(cat) : `/search?q=${encodeURIComponent(teacher.skill)}`} className="chip static">{teacher.skill}</Link>
                {teacher.otherSkills.map((s) => (
                  <Link key={s} href={`/search?q=${encodeURIComponent(s)}`} className="chip static" style={{ textTransform: "capitalize" }}>
                    {s}
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {teacher.premisesPhotoUrls.length > 0 && (
            <section aria-labelledby="gallery-h">
              <div className="card-head" style={{ marginBottom: 14 }}>
                <h2 id="gallery-h">Work & learning space</h2>
                <span className="muted small">{teacher.premisesPhotoUrls.length} photo{teacher.premisesPhotoUrls.length === 1 ? "" : "s"}</span>
              </div>
              <div className="gallery">
                {teacher.premisesPhotoUrls.map((url, i) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer" aria-label={`Open photo ${i + 1} of ${teacher.premisesPhotoUrls.length} in a new tab`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`${first}'s work or learning space, photo ${i + 1}`} loading="lazy" />
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
                {signedIn ? (
                  <>
                    <strong>{teacher.address}</strong>
                    <span className="muted small">{area}. The pin was confirmed during verification.</span>
                    <div>
                      <a className="btn secondary sm" href={directions} target="_blank" rel="noreferrer">
                        <Icon name="navigation" /> Get directions
                      </a>
                    </div>
                  </>
                ) : (
                  <>
                    <strong>{area}</strong>
                    <span className="muted small">
                      The exact address and directions are shared with signed-in members.{" "}
                      <Link href={`/login?callbackUrl=${back}`} className="link">Sign in</Link>
                    </span>
                  </>
                )}
              </div>
            </div>
          </section>

          <section className="card soft" aria-labelledby="safety-h">
            <h2 id="safety-h" style={{ marginBottom: 16 }}>Learning safely</h2>
            <ul className="checks">
              <li><Icon name="check" /> {verified ? `${first}'s ID, photo and premises were checked by the Ujuzi Link team.` : "This profile has not been verified yet."}</li>
              <li><Icon name="check" /> Meet at the place of trade, ideally during working hours.</li>
              <li><Icon name="check" /> Agree what you&apos;ll learn and the price before you start, then pay {first} directly.</li>
              <li><Icon name="check" /> Ujuzi Link never asks you to pay through the app.</li>
            </ul>
          </section>
        </div>

        <aside className="profile-aside">
          <div className="card contact-card">
            <h2>Ready to learn?</h2>
            {signedIn ? (
              <>
                <p className="muted small" style={{ margin: 0 }}>Contact {first} directly to arrange a visit and agree the price.</p>
                <a className="btn lg block" href={`tel:+${teacher.phone}`}>
                  <Icon name="phone" /> Call +{teacher.phone}
                </a>
                <a className="btn secondary block" href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer">
                  <Icon name="chat" /> WhatsApp {first}
                </a>
              </>
            ) : (
              <>
                <p className="muted small" style={{ margin: 0 }}>Contact details are available after you sign in. It&apos;s free for learners.</p>
                <Link className="btn lg block" href={`/login?callbackUrl=${back}`}>
                  Sign in to contact <Icon name="arrow" />
                </Link>
                <p className="small muted" style={{ margin: 0, textAlign: "center" }}>
                  New here? <Link href={`/register?callbackUrl=${back}`} className="link">Create a free account</Link>
                </p>
              </>
            )}
            <hr className="divider" />
            <ul className="checks small">
              <li><Icon name="lock" /> Phone and WhatsApp visible to members only</li>
              <li><Icon name="check" /> No fees for learners, ever</li>
            </ul>
          </div>
        </aside>
      </div>

      <p className="xs muted" style={{ marginTop: 32 }}>Identity documents are private. Verification is reviewed by the Ujuzi Link team.</p>

      <div className="mobile-cta">
        {signedIn ? (
          <>
            <a className="btn" href={`tel:+${teacher.phone}`}><Icon name="phone" /> Call</a>
            <a className="btn secondary" href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer"><Icon name="chat" /> WhatsApp</a>
          </>
        ) : (
          <Link className="btn" href={`/login?callbackUrl=${back}`}>Sign in to contact <Icon name="arrow" /></Link>
        )}
      </div>
    </div>
  );
}
