import Link from "next/link";
import { existsSync } from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { activeWhere } from "@/lib/subscription";
import { CATEGORIES, categoryHref, matchesCategory } from "@/lib/skills";
import { SKILL_PHOTOS } from "@/lib/skillPhotos";
import Icon from "@/components/Icon";
import SkillsBrowser, { type SkillItem } from "./SkillsBrowser";

export const metadata = { title: "Explore skills · Ujuzi Link" };

const photo = (name: string) => (existsSync(path.join(process.cwd(), "public", "images", name)) ? `/images/${name}` : null);
/** Drop a licensed photo at public/images/explore.jpg to override the hero; falls back to the homepage photo. */
const HERO_PHOTO = photo("explore.jpg") ?? photo("hero.jpg");

type ActiveTeacher = { skill: string; otherSkills: string[]; bio: string; businessName: string | null; premisesPhotoUrls: string[] };

async function activeTeachers(): Promise<ActiveTeacher[] | null> {
  try {
    return await prisma.teacherProfile.findMany({
      where: activeWhere(),
      select: { skill: true, otherSkills: true, bio: true, businessName: true, premisesPhotoUrls: true },
      orderBy: { verifiedAt: "desc" },
      take: 5000,
    });
  } catch {
    return null; // render categories without counts if the database is briefly unavailable
  }
}

export default async function SkillsPage() {
  const teachers = await activeTeachers();

  const items: SkillItem[] = CATEGORIES.map((c) => {
    const matching = (teachers ?? []).filter((t) => matchesCategory(c, t.skill, t.otherSkills.join(" "), t.businessName, t.bio));
    const photo = SKILL_PHOTOS[c.slug];
    // Standard categories use their licensed category photo; a teacher's premises photo is only a fallback.
    const premises = matching.find((t) => t.premisesPhotoUrls[0])?.premisesPhotoUrls[0] ?? null;
    return {
      key: c.slug,
      name: c.name,
      sub: c.sub,
      icon: c.icon,
      tone: c.tone,
      href: categoryHref(c),
      count: teachers ? matching.length : null,
      image: photo
        ? { src: photo.src, alt: photo.alt, focus: photo.focus, optimize: true }
        : premises
          ? { src: premises, alt: "", focus: "50% 50%", optimize: false }
          : null,
      keywords: c.terms.join(" "),
    };
  });

  // Skills teachers actually list that don't fall under a standard category get their own card.
  const extra = new Map<string, { name: string; count: number; image: string | null }>();
  for (const t of teachers ?? []) {
    if (CATEGORIES.some((c) => matchesCategory(c, t.skill))) continue;
    const key = t.skill.trim().toLowerCase();
    const cur = extra.get(key) ?? { name: t.skill.trim(), count: 0, image: null };
    cur.count += 1;
    cur.image ??= t.premisesPhotoUrls[0] ?? null;
    extra.set(key, cur);
  }
  for (const [key, e] of extra) {
    items.push({
      key: `skill-${key}`,
      name: e.name.charAt(0).toUpperCase() + e.name.slice(1),
      sub: "Taught locally",
      icon: "graduation",
      tone: "sage",
      href: `/search?q=${encodeURIComponent(e.name)}`,
      count: e.count,
      image: e.image ? { src: e.image, alt: "", focus: "50% 50%", optimize: false } : null,
      keywords: key,
    });
  }

  return (
    <>
      <section className="container explore-top">
        <div className="explore-hero">
          {HERO_PHOTO && <div className="explore-photo" style={{ backgroundImage: `url(${HERO_PHOTO})` }} role="img" aria-label="A teacher guiding a learner at a workbench" />}
          <div className="explore-copy">
            <span className="eyebrow">Discover what is possible</span>
            <h1>What would you like to learn?</h1>
            <p>Practical skills. Local experts. A better future starts close to home.</p>
            <div className="row">
              <Link href="/search" className="btn light lg">
                Find teachers near me <Icon name="arrow" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container section" style={{ paddingTop: "clamp(40px, 6vw, 72px)" }} aria-labelledby="browse-h">
        <div className="section-head" style={{ marginBottom: 20 }}>
          <div>
            <h2 id="browse-h">Browse by skill</h2>
            <p className="muted">Explore hands-on skills taught by verified people in your community.</p>
          </div>
        </div>
        <SkillsBrowser items={items} countsAvailable={!!teachers} />
      </section>

      <section className="container section" style={{ paddingBottom: 96 }} aria-labelledby="share-h">
        <div className="share-band">
          <div>
            <h2 id="share-h">Have a skill to share with your community?</h2>
            <p>Get verified, get listed for learners nearby, and keep everything they pay you. Your first month is free.</p>
          </div>
          <Link href="/register?role=TEACHER" className="btn light lg">
            Become a teacher <Icon name="arrow" />
          </Link>
        </div>
      </section>
    </>
  );
}
