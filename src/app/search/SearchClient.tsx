"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TeacherMap from "@/components/TeacherMap";
import Icon from "@/components/Icon";
import type { TeacherCardData } from "@/components/TeacherCard";
import { useGoogleMaps } from "@/components/useGoogleMaps";
import { CATEGORIES, categoryBySlug, iconForSkill } from "@/lib/skills";
import { DEFAULT_PLACE, PLACES, placeBySlug } from "@/lib/places";

type Result = TeacherCardData & {
  latitude: number;
  longitude: number;
  distanceKm: number;
  bio: string;
  otherSkills: string[];
  area?: string;
};
type LatLng = { lat: number; lng: number };
type Status = "idle" | "loading" | "ok" | "error";

const RADII = [5, 10, 25, 50, 150];

export default function SearchClient({
  initialQuery,
  initialNear,
  initialSkill,
}: {
  initialQuery: string;
  initialNear: string;
  initialSkill: string;
}) {
  const [skill, setSkill] = useState(categoryBySlug(initialSkill) ? initialSkill : "");
  const [q, setQ] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery); // the submitted free-text query
  const [near, setNear] = useState(placeBySlug(initialNear) ? initialNear : "me");
  const [radius, setRadius] = useState(25);
  const [sort, setSort] = useState<"nearest" | "name">("nearest");
  const [center, setCenter] = useState<LatLng | null>(() => {
    const p = placeBySlug(initialNear);
    return p ? { lat: p.lat, lng: p.lng } : null;
  });
  const [locNote, setLocNote] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [offline, setOffline] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "map">("list");
  const { error: mapError } = useGoogleMaps();
  const abort = useRef<AbortController | null>(null);

  const category = categoryBySlug(skill);
  // A category searches all of its terms; free text searches what was typed.
  const apiQuery = query || (category ? category.terms.join(",") : "");

  const locate = useCallback(() => {
    setLocNote("");
    if (!navigator.geolocation) {
      setCenter({ lat: DEFAULT_PLACE.lat, lng: DEFAULT_PLACE.lng });
      setLocNote(`Your browser can't share location, so we're showing teachers around ${DEFAULT_PLACE.name}.`);
      return;
    }
    setCenter(null);
    navigator.geolocation.getCurrentPosition(
      (p) => setCenter({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {
        setCenter({ lat: DEFAULT_PLACE.lat, lng: DEFAULT_PLACE.lng });
        setLocNote(`Location access is off, so we're showing ${DEFAULT_PLACE.name}. Choose your town or allow location.`);
      },
      { timeout: 10000, maximumAge: 300000 },
    );
  }, []);

  useEffect(() => {
    if (near === "me") locate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const search = useCallback(async () => {
    if (!center) return;
    abort.current?.abort();
    const ctrl = new AbortController();
    abort.current = ctrl;
    setStatus("loading");
    const params = new URLSearchParams({ lat: String(center.lat), lng: String(center.lng), radius: String(radius) });
    if (apiQuery) params.set("q", apiQuery);
    try {
      const res = await fetch(`/api/teachers?${params}`, { signal: ctrl.signal });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResults(data.results);
      setStatus("ok");
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setStatus("error");
    }
  }, [center, radius, apiQuery]);

  useEffect(() => {
    search();
  }, [search]);

  useEffect(() => {
    if (!offline && status === "error") search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offline]);

  function syncUrl(next: { q?: string; skill?: string; near?: string }) {
    const params = new URLSearchParams();
    const nq = next.q ?? query;
    const ns = next.skill ?? skill;
    const nn = next.near ?? near;
    if (nq) params.set("q", nq);
    else if (ns) params.set("skill", ns);
    if (nn !== "me") params.set("near", nn);
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `/search?${qs}` : "/search");
  }

  function submitText(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    setQuery(trimmed);
    if (trimmed) setSkill("");
    syncUrl({ q: trimmed, skill: trimmed ? "" : skill });
  }

  function chooseSkill(slug: string) {
    setSkill(slug);
    setQ("");
    setQuery("");
    syncUrl({ q: "", skill: slug });
  }

  function changePlace(slug: string) {
    setNear(slug);
    syncUrl({ near: slug });
    const p = placeBySlug(slug);
    if (p) {
      setLocNote("");
      setCenter({ lat: p.lat, lng: p.lng });
    } else locate();
  }

  const selectFromMap = useCallback((id: string) => {
    setActiveId(id);
    if (window.matchMedia("(max-width: 999px)").matches) setView("list");
    requestAnimationFrame(() => {
      const card = document.getElementById(`teacher-${id}`);
      card?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      card?.focus({ preventScroll: true });
    });
  }, []);

  const sorted = useMemo(
    () => (sort === "name" ? [...results].sort((a, b) => a.name.localeCompare(b.name)) : results),
    [results, sort],
  );

  const placeName = placeBySlug(near)?.name;
  const what = query ? `“${query}”` : category ? category.name.toLowerCase() : "";
  const noMap = !!mapError;

  return (
    <>
      <div className="search-head">
        <div className="container">
          <Link href="/" className="back-link hide-desktop"><Icon name="arrowLeft" /> Home</Link>
          <h1>Find verified teachers near you</h1>
          <p className="muted" style={{ margin: "-8px 0 20px" }}>Search locally, compare options and choose a practical learning experience.</p>
          <form className="search-tools" role="search" onSubmit={submitText}>
            <div className="search-bar">
              <Icon name="search" />
              <label htmlFor="search-q" className="sr-only">What do you want to learn?</label>
              <input
                id="search-q"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={category ? `${category.name} — or type any skill` : "What do you want to learn?"}
                autoComplete="off"
              />
            </div>
            <label className="select-icon">
              <Icon name="pin" />
              <span className="sr-only">Location</span>
              <select value={near} onChange={(e) => changePlace(e.target.value)}>
                <option value="me">My location</option>
                {PLACES.map((p) => (
                  <option key={p.slug} value={p.slug}>{p.name}, Kenya</option>
                ))}
              </select>
            </label>
            <button className="btn" type="submit">Find teachers <Icon name="arrow" /></button>
          </form>

          <div className="filters" role="group" aria-label="Filters">
            <label className="filter">
              <span className="sr-only">Skill</span>
              <select value={skill} onChange={(e) => chooseSkill(e.target.value)} aria-label="Skill">
                <option value="">All skills</option>
                {CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </label>
            <label className="filter">
              <span className="sr-only">Distance</span>
              <select value={radius} onChange={(e) => setRadius(Number(e.target.value))} aria-label="Distance">
                {RADII.map((r) => (
                  <option key={r} value={r}>Within {r} km</option>
                ))}
              </select>
            </label>
            <span className="filter static" title="Only teachers verified by the Ujuzi Link team are ever listed">
              Verified <Icon name="check" />
            </span>
            <label className="filter">
              <span className="sr-only">Sort</span>
              <select value={sort} onChange={(e) => setSort(e.target.value as "nearest" | "name")} aria-label="Sort">
                <option value="nearest">Sort: Nearest</option>
                <option value="name">Sort: Name A–Z</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="container">
        <div className={`search-body${noMap ? " no-map" : ""}`} data-view={view}>
          <div className="results-col">
            {offline && (
              <div className="alert warn" role="status" style={{ marginBottom: 12 }}>
                <Icon name="wifiOff" />
                <div><strong>You&apos;re offline</strong><p>Results will refresh when your connection is back.</p></div>
              </div>
            )}
            {locNote && (
              <div className="alert info" role="status" style={{ marginBottom: 12 }}>
                <Icon name="info" />
                <p style={{ margin: 0 }}>{locNote}</p>
              </div>
            )}

            <div className="results-head">
              <h2>Nearby teachers</h2>
              <p className="muted small" aria-live="polite">
                {!center || status === "loading" || status === "idle"
                  ? center ? "Finding teachers…" : "Getting your location…"
                  : status === "ok"
                    ? `${results.length} verified teacher${results.length === 1 ? "" : "s"}${what ? ` for ${what}` : ""} within ${radius} km${placeName ? ` of ${placeName}` : ""}`
                    : ""}
              </p>
            </div>

            {!center || status === "loading" || status === "idle" ? (
              <ul className="results" aria-hidden>
                {[0, 1, 2, 3].map((i) => (
                  <li key={i} className="skeleton" style={{ height: 140 }} />
                ))}
              </ul>
            ) : status === "error" ? (
              <div className="state">
                <span className="icon-tile amber"><Icon name={offline ? "wifiOff" : "alert"} /></span>
                <h3>{offline ? "No connection" : "We couldn't load teachers"}</h3>
                <p>{offline ? "Check your data or Wi-Fi. We'll try again automatically." : "Something went wrong on our side. Please try again."}</p>
                <button type="button" className="btn secondary" onClick={search}>
                  <Icon name="refresh" /> Try again
                </button>
              </div>
            ) : results.length === 0 ? (
              <div className="state">
                <span className="icon-tile"><Icon name="search" /></span>
                <h3>No verified teachers here yet</h3>
                <p>
                  {what ? <>Nobody teaching {what} within {radius} km. </> : <>No teachers within {radius} km. </>}
                  Try a wider distance or another skill. New teachers are verified every week.
                </p>
                <div className="row">
                  {radius < 150 && (
                    <button type="button" className="btn" onClick={() => setRadius(150)}>Search within 150 km</button>
                  )}
                  {(query || skill) && (
                    <button type="button" className="btn secondary" onClick={() => chooseSkill("")}>Show all skills</button>
                  )}
                </div>
              </div>
            ) : (
              <ul className="results">
                {sorted.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/teachers/${t.id}`}
                      id={`teacher-${t.id}`}
                      className={`rcard${activeId === t.id ? " is-active" : ""}`}
                      onMouseEnter={() => setActiveId(t.id)}
                      onFocus={() => setActiveId(t.id)}
                    >
                      <div className="rcard-media">
                        {t.coverUrl || t.profilePhotoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={t.coverUrl ?? t.profilePhotoUrl} alt="" loading="lazy" />
                        ) : (
                          <Icon name={iconForSkill(t.skill)} />
                        )}
                      </div>
                      <div className="rcard-body">
                        <div className="rcard-title">{t.name}</div>
                        <div className="rcard-sub">{t.businessName ? `${t.skill} · ${t.businessName}` : t.skill}</div>
                        <span className="verified-badge"><Icon name="check" /> Verified by Ujuzi Link</span>
                        <div className="rcard-foot">
                          <span className="distance"><Icon name="navigation" /> {t.distanceKm} km away</span>
                          {t.area && <span>· {t.area}</span>}
                          <span className="rcard-cta">View profile <Icon name="arrow" /></span>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {!noMap && (
            <div className="map-col">
              <div className="map-wrap">
                <span className="map-label"><Icon name="pin" /> {placeName ?? "Your area"} · teacher locations</span>
                {center ? (
                  <TeacherMap center={center} teachers={sorted} onSelect={selectFromMap} activeId={activeId} />
                ) : (
                  <div className="map skeleton" />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {!noMap && (
        <div className="view-toggle" role="group" aria-label="Results view">
          <button type="button" aria-pressed={view === "list"} onClick={() => setView("list")}>
            <Icon name="list" /> List
          </button>
          <button type="button" aria-pressed={view === "map"} onClick={() => setView("map")}>
            <Icon name="map" /> Map
          </button>
        </div>
      )}
    </>
  );
}
