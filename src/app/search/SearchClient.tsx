"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import TeacherMap from "@/components/TeacherMap";

type Result = {
  id: string;
  name: string;
  skill: string;
  otherSkills: string[];
  bio: string;
  businessName: string | null;
  address: string;
  latitude: number;
  longitude: number;
  profilePhotoUrl: string;
  distanceKm: number;
};

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

  const pins = useMemo(() => results, [results]);

  return (
    <div className="stack">
      <h1>Find a teacher near you</h1>
      <form
        className="search-bar"
        onSubmit={(e) => {
          e.preventDefault();
          window.history.replaceState(null, "", q ? `/search?q=${encodeURIComponent(q)}` : "/search");
          search(q);
        }}
      >
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Skill, e.g. baking" aria-label="Skill" />
        <select value={radius} onChange={(e) => setRadius(Number(e.target.value))} aria-label="Distance" style={{ width: "auto" }}>
          <option value={5}>Within 5 km</option>
          <option value={10}>Within 10 km</option>
          <option value={25}>Within 25 km</option>
          <option value={50}>Within 50 km</option>
          <option value={150}>Within 150 km</option>
        </select>
        <button className="btn" type="submit">
          Search
        </button>
      </form>
      {locNote && <div className="alert info small">{locNote}</div>}
      {error && <div className="alert">{error}</div>}

      <div className="split">
        <div className="stack" style={{ order: 2 }}>
          {!center || loading ? (
            <p className="muted">{center ? "Searching..." : "Getting your location..."}</p>
          ) : results.length === 0 ? (
            <div className="card">
              <strong>No teachers found yet.</strong>
              <p className="muted small">Try a wider distance or a different skill.</p>
            </div>
          ) : (
            <>
              <p className="small muted">
                {results.length} teacher{results.length === 1 ? "" : "s"}, nearest first
              </p>
              {results.map((t) => (
                <Link
                  key={t.id}
                  href={`/teachers/${t.id}`}
                  className="card teacher-card"
                  style={{ color: "inherit", outline: selected === t.id ? "2px solid var(--brand)" : undefined }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.profilePhotoUrl} alt="" className="avatar" />
                  <div>
                    <strong>{t.name}</strong> <span className="badge green">Verified</span>
                    <div>
                      {t.skill}
                      {t.businessName ? ` · ${t.businessName}` : ""}
                    </div>
                    <div className="small muted">
                      {t.distanceKm} km away · {t.address}
                    </div>
                  </div>
                </Link>
              ))}
            </>
          )}
        </div>
        <div style={{ order: 1 }}>{center && <TeacherMap center={center} teachers={pins} onSelect={setSelected} />}</div>
      </div>
    </div>
  );
}
