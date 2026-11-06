"use client";
import { useCallback, useEffect, useState } from "react";
import TeacherMap from "@/components/TeacherMap";
import TeacherCard, { type TeacherCardData } from "@/components/TeacherCard";
import { CATEGORIES } from "@/lib/skills";

type Result = TeacherCardData & { latitude: number; longitude: number; distanceKm: number };

const NAIROBI = { lat: -1.2864, lng: 36.8172 };

export default function SearchClient({ initialQuery }: { initialQuery: string }) {
  const [q, setQ] = useState(initialQuery);
  const [radius, setRadius] = useState(25);
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [locNote, setLocNote] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setCenter(NAIROBI);
      setLocNote("Your browser can't share location, so we're showing teachers around Nairobi.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => setCenter({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {
        setCenter(NAIROBI);
        setLocNote("Allow location access to see teachers closest to you. Showing Nairobi for now.");
      },
      { timeout: 10000 },
    );
  }, []);

  const search = useCallback(
    async (query: string) => {
      if (!center) return;
      setLoading(true);
      setError("");
      const params = new URLSearchParams({ lat: String(center.lat), lng: String(center.lng), radius: String(radius) });
      if (query) params.set("q", query);
      try {
        const res = await fetch(`/api/teachers?${params}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setResults(data.results);
      } catch {
        setError("Couldn't load teachers. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [center, radius],
  );

  useEffect(() => {
    search(q);
    // Re-run when location or radius changes; text searches run on submit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function run(query: string) {
    setQ(query);
    window.history.replaceState(null, "", query ? `/search?q=${encodeURIComponent(query)}` : "/search");
    search(query);
  }

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div>
        <h1 style={{ fontSize: "clamp(1.7rem, 4vw, 2.4rem)", marginBottom: 6 }}>
          {q ? `${q.charAt(0).toUpperCase()}${q.slice(1)} teachers near you` : "Teachers near you"}
        </h1>
        <p className="muted" style={{ margin: 0 }}>Verified, local and free to contact. Nearest first.</p>
      </div>

      <form className="toolbar" onSubmit={(e) => { e.preventDefault(); run(q); }}>
        <div className="search-pill" style={{ border: "1.5px solid var(--border)" }}>
          <span aria-hidden>🔍</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Skill, e.g. baking" aria-label="Skill" />
          <button className="btn" type="submit">Search</button>
        </div>
        <select value={radius} onChange={(e) => setRadius(Number(e.target.value))} aria-label="Distance">
          <option value={5}>Within 5 km</option>
          <option value={10}>Within 10 km</option>
          <option value={25}>Within 25 km</option>
          <option value={50}>Within 50 km</option>
          <option value={150}>Within 150 km</option>
        </select>
      </form>

      <div className="chips" role="list">
        <button type="button" className={`chip${!q ? " active" : ""}`} onClick={() => run("")}>All skills</button>
        {CATEGORIES.map((c) => (
          <button key={c.name} type="button" className={`chip${q.toLowerCase() === c.name.toLowerCase() ? " active" : ""}`} onClick={() => run(c.name)}>
            <span aria-hidden>{c.icon}</span> {c.name}
          </button>
        ))}
      </div>

      {locNote && <div className="alert info small">{locNote}</div>}
      {error && <div className="alert">{error}</div>}

      <div className="search-layout">
        <div>
          {!center || loading ? (
            <p className="muted">{center ? "Searching..." : "Getting your location..."}</p>
          ) : results.length === 0 ? (
            <div className="card flat stack" style={{ alignItems: "flex-start" }}>
              <h3>No teachers found yet</h3>
              <p className="muted" style={{ margin: 0 }}>Try a wider distance or a different skill. New teachers join every week.</p>
              <button type="button" className="btn secondary sm" onClick={() => setRadius(150)}>Search within 150 km</button>
            </div>
          ) : (
            <>
              <p className="small muted" style={{ marginTop: 0 }}>
                {results.length} teacher{results.length === 1 ? "" : "s"} found
              </p>
              <div className="cards-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
                {results.map((t) => (
                  <TeacherCard key={t.id} t={t} highlighted={selected === t.id} />
                ))}
              </div>
            </>
          )}
        </div>
        <div className="map-col">{center && <TeacherMap center={center} teachers={results} onSelect={setSelected} />}</div>
      </div>
    </div>
  );
}
