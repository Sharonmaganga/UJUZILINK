import Link from "next/link";
import { existsSync } from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { activeWhere, PRICE_KES, TRIAL_DAYS } from "@/lib/subscription";
import { CATEGORIES } from "@/lib/skills";
import TeacherCard, { type TeacherCardData } from "@/components/TeacherCard";
import HeroSearch from "@/components/HeroSearch";
import Icon from "@/components/Icon";

async function featuredTeachers(): Promise<TeacherCardData[]> {
  try {
    const rows = await prisma.teacherProfile.findMany({
      where: activeWhere(),
      orderBy: { verifiedAt: "desc" },
      take: 6,
      select: {
        id: true, skill: true, businessName: true, address: true, profilePhotoUrl: true, premisesPhotoUrls: true,
        user: { select: { name: true } },
      },
    });
    return rows.map((t) => ({
      id: t.id, name: t.user.name, skill: t.skill, businessName: t.businessName, address: t.address,
      profilePhotoUrl: t.profilePhotoUrl, coverUrl: t.premisesPhotoUrls[0] ?? null,
    }));
  } catch {
    // The home page should still load (and pass health checks) if the database is briefly unavailable.
    return [];
  }
}

/** Drop a licensed photo at public/images/hero.jpg to switch the hero to the photographic layout. */
const HERO_PHOTO = existsSync(path.join(process.cwd(), "public", "images", "hero.jpg")) ? "/images/hero.jpg" : null;

const FAQS = [
  ["Is Ujuzi Link really free for learners?", "Yes. Searching, creating an account and contacting teachers is free. You only pay the teacher for lessons, directly, once you've met and agreed on a price."],
  ["How do I pay a teacher?", "You agree on the price with the teacher and pay them directly, in cash or M-Pesa. Ujuzi Link never takes payment for lessons and never asks you to pay through the app."],
  ["How are teachers verified?", "Every teacher gives us a valid national ID or passport, a clear photo of themselves, photos of their place of trade and a pinned location. Our team checks these before the teacher is shown to learners."],
  ["How much does it cost to teach?", `Your first ${TRIAL_DAYS} days are free from the day you're verified. After that it's KES ${PRICE_KES} a month, paid by M-Pesa, to stay listed for learners near you.`],
  ["What skills can I learn?", "Anything someone near you can teach: tailoring, hairdressing, mechanics, baking, carpentry, coding, music, photography, farming and much more."],
];

const STEPS = [
  { icon: "search", title: "Search a skill", body: "Tell us what you want to learn. We list verified teachers nearest to you, on a map." },
  { icon: "chat", title: "Contact the teacher", body: "Create a free account to see their phone and WhatsApp, then arrange a visit." },
  { icon: "store", title: "Visit their place of trade", body: "Meet at their verified workshop, salon or studio and see the work first-hand." },
  { icon: "cash", title: "Agree and learn", body: "Agree what you'll learn and the price, then pay the teacher directly. No middleman." },
] as const;

const TRUST = [
  { icon: "idcard", title: "Valid ID", body: "National ID or passport checked by our team. Never shown to learners." },
  { icon: "user", title: "Real photo", body: "A clear, current photo so you know who you're meeting." },
  { icon: "store", title: "Place of trade", body: "Photos of the premises where lessons actually happen." },
  { icon: "pin", title: "Pinned location", body: "A confirmed location, so distances in search are real." },
] as const;

function CategoryCard({ c }: { c: (typeof CATEGORIES)[number] }) {
  return (
    <Link href={`/search?q=${encodeURIComponent(c.name)}`} className="cat">
      <span className={`icon-tile${c.tone === "amber" ? " amber" : ""}`}>
        <Icon name={c.icon} />
      </span>
      <span>
        <strong>{c.name}</strong>
        <span className="sub">{c.sub}</span>
      </span>
      <Icon name="chevronRight" className="arrow" />
    </Link>
  );
}

export default async function Home() {
  const teachers = await featuredTeachers();

  return (
    <>
      <section className={`hero${HERO_PHOTO ? " has-photo" : ""}`}>
        {HERO_PHOTO && <div className="hero-photo" style={{ backgroundImage: `url(${HERO_PHOTO})` }} aria-hidden />}
        <div className="container hero-grid">
          <div>
            <span className="eyebrow reveal">Learn hands-on skills, locally</span>
            <h1 className="reveal d1">
              Great skills are closer than <em>you think.</em>
            </h1>
            <p className="lead reveal d2">
              Meet verified teachers near you. Learn practical skills at your own pace, in your own community.
            </p>
            <div className="reveal d3" style={{ marginTop: 32 }}>
              <HeroSearch />
              {HERO_PHOTO && (
                <div className="hero-trust">
                  <span><Icon name="check" /> Verified teachers</span>
                  <span><Icon name="pin" /> Near you</span>
                  <span><Icon name="hammer" /> Hands-on learning</span>
                </div>
              )}
            </div>
          </div>
          {!HERO_PHOTO && (
            <div className="hero-art-wrap reveal d2" aria-hidden>
              <div className="hero-art">
                <div className="grid-lines" />
                <div className="arch" />
                <div className="sun" />
                <div className="ground" />
                <div className="float-card a float">
                  <span className="check">
                    <Icon name="check" />
                  </span>
                  <div>
                    <strong>Verified teacher network</strong>
                    <span>Real skills. Real people.</span>
                  </div>
                </div>
                <div className="float-card b">
                  <Icon name="pin" />
                  <span>Nearest first</span>
                </div>
              </div>
            </div>
          )}
        </div>
        {HERO_PHOTO && (
          <div className="container hero-cats reveal d3">
            <h2>Explore popular skill categories</h2>
            <div className="cat-grid">
              {CATEGORIES.slice(0, 4).map((c) => (
                <CategoryCard key={c.name} c={c} />
              ))}
            </div>
          </div>
        )}
      </section>

      <div className="container">
        <section className="section" style={{ paddingTop: HERO_PHOTO ? 48 : 8 }} aria-labelledby="skills-h">
          <div className="section-head">
            <h2 id="skills-h" style={{ fontSize: "clamp(1.3rem, 2.4vw, 1.6rem)" }}>
              {HERO_PHOTO ? "More skills to learn" : "Explore popular skills near you"}
            </h2>
            <Link href="/search" className="link">
              Browse all teachers
            </Link>
          </div>
          <div className="cat-grid">
            {(HERO_PHOTO ? CATEGORIES.slice(4) : CATEGORIES.slice(0, 8)).map((c) => (
              <CategoryCard key={c.name} c={c} />
            ))}
          </div>
        </section>

        <section className="section" id="how" aria-labelledby="how-h">
          <div className="section-head">
            <div>
              <span className="eyebrow">How Ujuzi Link works</span>
              <h2 id="how-h" style={{ marginTop: 12 }}>From curious to capable in four steps</h2>
            </div>
            <p className="muted" style={{ maxWidth: 380 }}>No fees for learners, no booking system. Just a direct line to people who do the work every day.</p>
          </div>
          <ol className="steps" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {STEPS.map((s, i) => (
              <li key={s.title} className="step">
                <span className="step-num">0{i + 1}</span>
                <span className="icon-tile sm">
                  <Icon name={s.icon} />
                </span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="section" aria-labelledby="discover-h">
          <div className="section-head">
            <div>
              <span className="eyebrow">Recently verified</span>
              <h2 id="discover-h" style={{ marginTop: 12 }}>Teachers ready to take learners</h2>
            </div>
            <Link href="/search" className="btn secondary">
              <Icon name="map" /> Find teachers near me
            </Link>
          </div>
          {teachers.length > 0 ? (
            <div className="cards-grid">
              {teachers.map((t) => (
                <TeacherCard key={t.id} t={t} />
              ))}
            </div>
          ) : (
            <div className="state">
              <span className="icon-tile">
                <Icon name="shield" />
              </span>
              <h3>Our first teachers are being verified</h3>
              <p>We only list teachers whose ID, photo and place of trade have been checked. Know a skill? Be one of the first.</p>
              <Link href="/register?role=TEACHER" className="btn">
                Become a teacher
              </Link>
            </div>
          )}
        </section>

        <section className="section" id="trust" aria-labelledby="trust-h">
          <div className="trust">
            <div className="stack">
              <span className="eyebrow">Trust & verification</span>
              <h2 id="trust-h">Every teacher is checked by a person, not a bot.</h2>
              <p style={{ margin: 0 }}>
                Before anyone appears in search, our team reviews four things. If something doesn&apos;t match, the profile isn&apos;t published.
              </p>
              <ul className="checks" style={{ marginTop: 8 }}>
                <li><Icon name="check" /> Only approved teachers with an active listing appear in search</li>
                <li><Icon name="check" /> Contact details are shown to signed-in members only</li>
                <li><Icon name="check" /> ID documents are visible only to Ujuzi Link admins</li>
              </ul>
            </div>
            <div className="trust-list">
              {TRUST.map((t) => (
                <div key={t.title} className="trust-item">
                  <span className="icon-tile sm">
                    <Icon name={t.icon} />
                  </span>
                  <h3 style={{ fontSize: "1rem" }}>{t.title}</h3>
                  <p>{t.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="teach" aria-labelledby="teach-h">
          <div className="cta">
            <div className="stack">
              <span className="eyebrow">For teachers</span>
              <h2 id="teach-h">Turn what you know into steady income</h2>
              <p className="lead" style={{ margin: 0 }}>
                Get listed for learners in your area who are looking for exactly what you do. They contact you directly, and pay you directly.
              </p>
              <ul className="checks" style={{ marginTop: 8 }}>
                <li><Icon name="check" /> Appear on the map for learners near you</li>
                <li><Icon name="check" /> A verified badge that builds trust</li>
                <li><Icon name="check" /> Keep 100% of what learners pay you</li>
              </ul>
            </div>
            <div className="price-card">
              <span className="badge amber" style={{ alignSelf: "flex-start" }}>First {TRIAL_DAYS} days free</span>
              <div className="price">
                KES {PRICE_KES} <small>/ month</small>
              </div>
              <p className="muted small" style={{ margin: 0 }}>
                Your free month starts the day you&apos;re verified. Then renew with M-Pesa whenever you want to stay listed.
              </p>
              <Link href="/register?role=TEACHER" className="btn lg block">
                Start teaching for free <Icon name="arrow" />
              </Link>
            </div>
          </div>
        </section>

        <section className="section" id="faq" aria-labelledby="faq-h" style={{ paddingBottom: 104 }}>
          <div className="grid-2" style={{ alignItems: "start", gap: 40 }}>
            <div>
              <span className="eyebrow">Questions</span>
              <h2 id="faq-h" style={{ marginTop: 12 }}>Frequently asked</h2>
            </div>
            <div className="faq">
              {FAQS.map(([q, a]) => (
                <details key={q}>
                  <summary>
                    {q}
                    <Icon name="plus" />
                  </summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
