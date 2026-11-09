"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import TeacherMap from "@/components/TeacherMap";
import Icon from "@/components/Icon";
import { teacherTitle, type TeacherCardData } from "@/components/TeacherCard";
import { useGoogleMaps } from "@/components/useGoogleMaps";
import { CATEGORIES, iconForSkill } from "@/lib/skills";
import { DEFAULT_PLACE, PLACES, placeBySlug } from "@/lib/places";

type Result = TeacherCardData & { latitude: number; longitude: number; distanceKm: number; bio: string; otherSkills: string[] };
type LatLng = { lat: number; lng: number };
type Status = "idle" | "loading" | "ok" | "error";

const RADII = [5, 10, 25, 50, 150];

export default function SearchClient({ initialQuery, initialNear }: { initialQuery: string; initialNear: string }) {
  const [q, setQ] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery); // the submitted query
  const [near, setNear] = useState(placeBySlug(initialNear) ? initialNear : "me");
  const [radius, setRadius] = useState(25);
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
  const listRef = useRef<HTMLUListElement>(null);
  const abort = useRef<AbortController | null>(null);

  // Ask the browser for the learner's position, falling back to Nairobi.
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
        setLocNote(`Location access is off, so we're showing ${DEFAULT_PLACE.name}. Pick your town above or allow location.`);
      },
      { timeout: 10000, maximumAge: 300000 },
    );
  }, []);

  useEffect(() => {
    if (near === "me") locate();
    // Only on first load; later changes go through changePlace.
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
    if (query) params.set("q", query);
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
  }, [center, radius, query]);

  useEffect(() => {
    search();
  }, [search]);

  // Retry automatically when the connection comes back.
  useEffect(() => {
    if (!offline && status === "error") search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offline]);

  function syncUrl(nextQuery: string, nextNear: string) {
    const params = new URLSearchParams();
    if (nextQuery) params.set("q", nextQuery);
    if (nextNear !== "me") params.set("near", nextNear);
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `/search?${qs}` : "/search");
  }

  function run(next: string) {
    const trimmed = next.trim();
    setQ(trimmed);
    setQuery(trimmed);
    syncUrl(trimmed, near);
  }

  function changePlace(slug: string) {
    setNear(slug);
    syncUrl(query, slug);
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

  const placeName = placeBySlug(near)?.name;
  const heading = `${query ? `${query.charAt(0).toUpperCase()}${query.slice(1)} teachers` : "Teachers"} ${placeName ? `near ${placeName}` : "near you"}`;
  const noMap = !!mapError;

  return (
    <>
      <div className="search-head">
        <div className="container">
          <span className="eyebrow">Explore teachers</span>
          <h1>{heading}</h1>
          <form
            className="search-tools"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              run(q);
            }}
          >
            <div className="search-bar">
              <Icon name="search" />
              <label htmlFor="search-q" className="sr-only">Skill</label>
              <input id="search-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Skill, e.g. baking or welding" autoComplete="off" />
              <button className="btn" type="submit">Search</button>
            </div>
            <label>
              <span className="sr-only">Location</span>
              <select value={near} onChange={(e) => changePlace(e.target.value)}>
                <option value="me">Near my location</option>
                {PLACES.map((p) => (
                  <option key={p.slug} value={p.slug}>{p.name}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="sr-only">Distance</span>
              <select value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
                {RADII.map((r) => (
                  <option key={r} value={r}>Within {r} km</option>
                ))}
              </select>
            </label>
          </form>
          <div className="chips" style={{ marginTop: 14 }} role="group" aria-label="Skill categories">
            <button type="button" className="chip" aria-pressed={!query} onClick={() => run("")}>All skills</button>
            {CATEGORIES.map((c) => (
              <button
                key={c.name}
                type="button"
                className="chip"
                aria-pressed={query.toLowerCase() === c.name.toLowerCase()}
                onClick={() => run(c.name)}
              >
                <Icon name={c.icon} /> {c.name}
              </button>
            ))}
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

            <div aria-live="polite">
              {!center || status === "loading" || status === "idle" ? (
                <>
                  <div className="results-meta">
                    <span className="pulse">{center ? "Finding teachers…" : "Getting your location…"}</span>
                  </div>
                  <ul className="results" aria-hidden>
                    {[0, 1, 2, 3].map((i) => (
                      <li key={i} className="skeleton" style={{ height: 122 }} />
                    ))}
                  </ul>
                </>
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
                    {query ? <>Nobody teaching &ldquo;{query}&rdquo; within {radius} km. </> : <>No teachers within {radius} km. </>}
                    Try a wider distance or another skill. New teachers are verified every week.
                  </p>
                  <div className="row">
                    {radius < 150 && (
                      <button type="button" className="btn" onClick={() => setRadius(150)}>Search within 150 km</button>
                    )}
                    {query && <button type="button" className="btn secondary" onClick={() => run("")}>Show all skills</button>}
                  </div>
                </div>
              ) : (
                <>
                  <div className="results-meta">
                    <span>
                      <strong style={{ color: "var(--ink)" }}>{results.length}</strong> verified teacher{results.length === 1 ? "" : "s"} · nearest first
                    </span>
                  </div>
                  <ul className="results" ref={listRef}>
                    {results.map((t) => (
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
                            <div className="rcard-top">
                              <span className="tcard-skill">{t.skill}</span>
                              <span className="distance"><Icon name="navigation" /> {t.distanceKm} km</span>
                            </div>
                            <div className="rcard-title">{teacherTitle(t)}</div>
                            <div className="rcard-sub">{t.bio}</div>
                            <div className="rcard-foot">
                              <span className="verified-badge"><Icon name="shield" /> Verified</span>
                              <span>{t.name}</span>
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>

          {!noMap && (
            <div className="map-col">
              {center ? (
                <TeacherMap center={center} teachers={results} onSelect={selectFromMap} activeId={activeId} />
              ) : (
                <div className="map skeleton" />
              )}
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
