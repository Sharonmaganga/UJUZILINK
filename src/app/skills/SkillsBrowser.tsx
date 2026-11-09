"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import Icon, { type IconName } from "@/components/Icon";

export type SkillItem = {
  key: string;
  name: string;
  sub: string;
  icon: IconName;
  tone: string;
  href: string;
  count: number | null;
  image: string | null;
  keywords: string;
};

/** Filterable grid of skill cards (search box + availability filter). */
export default function SkillsBrowser({ items, countsAvailable }: { items: SkillItem[]; countsAvailable: boolean }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "available">("all");

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter(
      (i) =>
        (filter === "all" || (i.count ?? 0) > 0) &&
        (!needle || `${i.name} ${i.sub} ${i.keywords}`.toLowerCase().includes(needle)),
    );
  }, [items, q, filter]);

  return (
    <div className="stack" style={{ gap: 24 }}>
      <div className="skills-tools" role="search">
        <div className="search-bar">
          <Icon name="search" />
          <label htmlFor="skills-q" className="sr-only">Search a skill</label>
          <input id="skills-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a skill — e.g. tailoring, cooking…" autoComplete="off" />
          {q && (
            <button type="button" className="btn ghost sm" onClick={() => setQ("")} aria-label="Clear search">
              <Icon name="x" />
            </button>
          )}
        </div>
        {countsAvailable && (
          <label className="filter">
            <span className="sr-only">Show</span>
            <select value={filter} onChange={(e) => setFilter(e.target.value as "all" | "available")}>
              <option value="all">All categories</option>
              <option value="available">Teachers available now</option>
            </select>
          </label>
        )}
      </div>

      <p className="sr-only" aria-live="polite">{shown.length} skills shown</p>

      {shown.length === 0 ? (
        <div className="state">
          <span className="icon-tile"><Icon name="search" /></span>
          <h3>{q ? `No skill category matches “${q}”` : "No teachers listed yet"}</h3>
          <p>{q ? "Teachers may still list it. Search all verified teachers for it directly." : "Switch to all categories to browse every skill."}</p>
          <div className="row">
            {q && (
              <Link href={`/search?q=${encodeURIComponent(q.trim())}`} className="btn">
                Search teachers for “{q.trim()}” <Icon name="arrow" />
              </Link>
            )}
            {filter !== "all" && (
              <button type="button" className="btn secondary" onClick={() => setFilter("all")}>Show all categories</button>
            )}
          </div>
        </div>
      ) : (
        <ul className="skill-grid">
          {shown.map((i) => (
            <li key={i.key}>
              <Link href={i.href} className="skill-card">
                <div className={`skill-media tone-${i.tone}`}>
                  {i.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={i.image} alt="" loading="lazy" />
                  ) : (
                    <Icon name={i.icon} />
                  )}
                </div>
                <div className="skill-body">
                  <strong>{i.name}</strong>
                  <span className="muted xs">{i.sub}</span>
                  {i.count !== null && (
                    <span className={`skill-count${i.count ? "" : " none"}`}>
                      {i.count ? `${i.count} verified teacher${i.count === 1 ? "" : "s"}` : "Be the first to teach this"}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
