import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { activeWhere, PRICE_KES, TRIAL_DAYS } from "@/lib/subscription";
import { CATEGORIES } from "@/lib/skills";
import TeacherCard, { type TeacherCardData } from "@/components/TeacherCard";

async function featuredTeachers(): Promise<TeacherCardData[]> {
  try {
    const rows = await prisma.teacherProfile.findMany({
      where: activeWhere(),
      orderBy: { verifiedAt: "desc" },
      take: 8,
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

const FAQS = [
  ["Is Ujuzi Link really free for learners?", "Yes. Searching, creating an account and contacting teachers is free. You only pay the teacher for lessons, directly, once you've met and agreed on a price."],
  ["How do I pay a teacher?", "You agree on the price with the teacher and pay them directly, in cash or M-Pesa. Ujuzi Link never takes payment for lessons and never asks you to pay through the app."],
  ["How are teachers verified?", "Every teacher gives us a valid national ID or passport, a clear photo of themselves, photos of their place of trade and a pinned location. Our team checks these before the teacher is shown to learners."],
  ["How much does it cost to teach?", `Your first ${TRIAL_DAYS} days are free from the day you're verified. After that it's KES ${PRICE_KES} a month, paid by M-Pesa, to stay featured to learners near you.`],
  ["What skills can I learn?", "Anything someone near you can teach: tailoring, hairdressing, mechanics, baking, carpentry, coding, music, photography, farming and much more."],
];

export default async function Home() {
  const teachers = await featuredTeachers();

  return (
    <>
      <section className="hero-band bleed">
        <div className="hero">
          <div>
            <div className="eyebrow">Free for learners · Verified teachers</div>
            <h1>
              Learn a real skill from someone <span className="hl">near you</span>
            </h1>
            <p className="lead">
              Ujuzi Link connects you with verified tailors, mechanics, hairdressers, bakers, coders and more in your
              neighbourhood. Meet them, agree, and start learning.
            </p>
            <form action="/search" className="search-pill" role="search">
              <span aria-hidden>🔍</span>
              <input name="q" placeholder="What do you want to learn?" aria-label="Skill" />
              <button className="btn" type="submit">
                Find teachers
              </button>
            </form>
            <div className="hero-trust">
              <span>✓ ID-verified teachers</span>
              <span>📍 Nearest first on the map</span>
              <span>💸 No fees for learners</span>
            </div>
          </div>
          <div className="hero-art" aria-hidden>
            <div className="hero-tile tall" style={{ background: "#fde8e4" }}>
              <span className="big">🧵</span>
              <div>
                <strong>Tailoring</strong>
                <div className="small">Gikomba · 1.2 km</div>
              </div>
            </div>
            <div className="hero-tile" style={{ background: "#fff1d6" }}>
              <span className="big">🧁</span>
              <strong>Baking</strong>
            </div>
            <div className="hero-tile dark">
              <span className="big">💻</span>
              <strong>Coding</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Explore skills</h2>
          <Link href="/search" className="link">
            See all teachers →
          </Link>
        </div>
        <div className="cat-grid">
          {CATEGORIES.map((c) => (
            <Link key={c.name} href={`/search?q=${encodeURIComponent(c.name)}`} className="cat" style={{ background: c.tint }}>
              <span className="ico">{c.icon}</span>
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      {teachers.length > 0 && (
        <section className="section">
          <div className="section-head">
            <div>
              <div className="eyebrow">New on Ujuzi Link</div>
              <h2>Recently verified teachers</h2>
            </div>
            <Link href="/search" className="link">
              Find teachers near me →
            </Link>
          </div>
          <div className="cards-grid">
            {teachers.map((t) => (
              <TeacherCard key={t.id} t={t} />
            ))}
          </div>
        </section>
      )}

      <section className="section" id="how">
        <h2>How it works</h2>
        <div className="features">
          <div className="feature">
            <div className="ico">🔍</div>
            <h3>Search a skill</h3>
            <p>Tell us what you want to learn. We show verified teachers closest to you on a map.</p>
          </div>
          <div className="feature">
            <div className="ico">💬</div>
            <h3>Contact the teacher</h3>
            <p>Create a free account to see their phone and WhatsApp, then arrange to meet at their place of trade.</p>
          </div>
          <div className="feature">
            <div className="ico">🤝</div>
            <h3>Meet and agree</h3>
            <p>Agree on what you&apos;ll learn and the price. You pay the teacher directly. No middleman, no fees.</p>
          </div>
          <div className="feature">
            <div className="ico">🛡️</div>
            <h3>Learn safely</h3>
            <p>Every teacher is checked with a valid ID, their photo, premises photos and a pinned location.</p>
          </div>
        </div>
      </section>

      <section className="section" id="teach">
        <div className="band">
          <div>
            <div className="pill-badges">
              <span className="pbadge yellow">For teachers</span>
              <span className="pbadge green">{TRIAL_DAYS} days free</span>
            </div>
            <h2 style={{ color: "#fff", fontSize: "clamp(1.6rem, 4vw, 2.4rem)" }}>Turn your skill into income</h2>
            <p>
              Get featured to learners in your area who are looking for exactly what you know. Learners contact you
              directly and pay you directly.
            </p>
            <ul>
              <li>Show up on the map for learners near you</li>
              <li>A verified badge that builds trust</li>
              <li>Keep 100% of what learners pay you</li>
            </ul>
          </div>
          <div className="stack" style={{ alignItems: "flex-start" }}>
            <div className="price">
              KES {PRICE_KES} <small>/ month</small>
            </div>
            <p style={{ margin: 0 }}>After your free first month. Pay with M-Pesa, cancel any time.</p>
            <Link href="/register?role=TEACHER" className="btn light lg">
              Start teaching for free
            </Link>
          </div>
        </div>
      </section>

      <section className="section faq" id="faq" style={{ maxWidth: 820 }}>
        <h2>Frequently asked questions</h2>
        {FAQS.map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </section>
    </>
  );
}
