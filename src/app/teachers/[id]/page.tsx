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
  const first = teacher.user.name.split(" ")[0];
  const cover = teacher.premisesPhotoUrls[0];
  const title = teacher.businessName || `Learn ${teacher.skill.toLowerCase()} with ${first}`;

  return (
    <div className="has-mobile-cta">
      <nav className="small muted" style={{ marginBottom: 20 }}>
        <Link href="/">Home</Link> › <Link href="/search">Teachers</Link> ›{" "}
        <Link href={`/search?q=${encodeURIComponent(teacher.skill)}`}>{teacher.skill}</Link>
      </nav>

      <div className="profile-layout" style={{ marginTop: 0 }}>
        <div>
          <div className="pill-badges">
            <span className="pbadge green">✓ ID verified</span>
            <span className="pbadge yellow">{teacher.skill}</span>
            {teacher.status !== "APPROVED" && <span className="pbadge pink">Not public yet</span>}
          </div>
          <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}>{title}</h1>
          <div className="avatar-stack">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={teacher.profilePhotoUrl} alt={teacher.user.name} className="avatar" style={{ width: 44, height: 44 }} />
            <div>
              <div>{teacher.user.name}</div>
              <div className="small muted" style={{ fontWeight: 400 }}>📍 {teacher.address}</div>
            </div>
          </div>

          <div className="tabs" style={{ marginTop: 24 }}>
            <a href="#about">About</a>
            <a href="#place">Place of trade</a>
            <a href="#location">Location</a>
            <a href="#safety">Safety</a>
          </div>

          {cover && (
            <div className="profile-cover">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cover} alt={`${teacher.user.name}'s place of trade`} />
            </div>
          )}

          <section id="about" className="section">
            <h2>About {first}</h2>
            <p className="prose">{teacher.bio}</p>
            {teacher.otherSkills.length > 0 && (
              <>
                <h3 style={{ marginTop: 20 }}>Also teaches</h3>
                <div className="chips" style={{ flexWrap: "wrap" }}>
                  {teacher.otherSkills.map((s) => (
                    <Link key={s} href={`/search?q=${encodeURIComponent(s)}`} className="chip">
                      {s}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </section>

          {teacher.premisesPhotoUrls.length > 0 && (
            <section id="place" className="section">
              <h2>Place of trade</h2>
              <div className="photos">
                {teacher.premisesPhotoUrls.map((url) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={url} src={url} alt="Premises" loading="lazy" />
                ))}
              </div>
            </section>
          )}

          <section id="location" className="section">
            <h2>Where you&apos;ll learn</h2>
            <p className="muted">{teacher.address}</p>
            <a className="btn secondary" href={directions} target="_blank" rel="noreferrer">
              🧭 Get directions
            </a>
          </section>

          <section id="safety" className="section">
            <h2>Learning safely</h2>
            <div className="safety">
              <div><span className="ico">🪪</span><span>{first}&apos;s ID, photo and premises were checked by the Ujuzi Link team.</span></div>
              <div><span className="ico">📍</span><span>Meet at the verified place of trade shown above.</span></div>
              <div><span className="ico">🤝</span><span>Agree on what you&apos;ll learn and the price before you start, then pay {first} directly.</span></div>
              <div><span className="ico">🚫</span><span>Ujuzi Link never asks you to pay through the app.</span></div>
            </div>
          </section>
        </div>

        <aside className="profile-aside">
          <div className="contact-card">
            <div className="small muted">Learn {teacher.skill.toLowerCase()} with</div>
            <strong style={{ fontSize: "1.1rem" }}>{teacher.user.name}</strong>
            <div className="free">Free to contact</div>
            <div className="small muted" style={{ marginTop: -8 }}>Agree the price with {first} and pay directly.</div>
            {session ? (
              <>
                <a className="btn brand lg block" href={`tel:+${teacher.phone}`}>📞 Call +{teacher.phone}</a>
                <a className="btn secondary block" href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer">
                  💬 WhatsApp
                </a>
              </>
            ) : (
              <>
                <Link className="btn brand lg block" href={`/register?callbackUrl=/teachers/${teacher.id}`}>
                  Join free to contact
                </Link>
                <p className="small muted" style={{ margin: 0, textAlign: "center" }}>
                  Already a member? <Link href={`/login?callbackUrl=/teachers/${teacher.id}`}>Log in</Link>
                </p>
              </>
            )}
            <ul className="checks">
              <li>ID-verified teacher</li>
              <li>Real place of trade, pinned on the map</li>
              <li>No fees for learners, ever</li>
            </ul>
          </div>
        </aside>
      </div>

      <div className="mobile-cta">
        {session ? (
          <>
            <a className="btn brand" href={`tel:+${teacher.phone}`}>📞 Call</a>
            <a className="btn secondary" href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer">💬 WhatsApp</a>
          </>
        ) : (
          <Link className="btn brand" href={`/register?callbackUrl=/teachers/${teacher.id}`}>Join free to contact {first}</Link>
        )}
      </div>
    </div>
  );
}
