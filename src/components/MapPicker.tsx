"use client";
import { useEffect, useRef, useState } from "react";
import { useGoogleMaps } from "./useGoogleMaps";
import Icon from "./Icon";

type LatLng = { lat: number; lng: number };
const NAIROBI: LatLng = { lat: -1.2864, lng: 36.8172 };

/** Lets a teacher pin the exact location of their place of trade. */
export default function MapPicker({ value, onChange }: { value: LatLng | null; onChange: (v: LatLng) => void }) {
  const { ready, error } = useGoogleMaps();
  const el = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const marker = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const map = useRef<any>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState("");

  useEffect(() => {
    if (!ready || !el.current || map.current) return;
    const g = window.google.maps;
    map.current = new g.Map(el.current, { center: value ?? NAIROBI, zoom: value ? 16 : 12, streetViewControl: false });
    marker.current = new g.Marker({ map: map.current, position: value ?? undefined, draggable: true });
    const set = (pos: { lat: () => number; lng: () => number }) => {
      const v = { lat: pos.lat(), lng: pos.lng() };
      marker.current.setPosition(v);
      onChange(v);
    };
    map.current.addListener("click", (e: { latLng: { lat: () => number; lng: () => number } }) => set(e.latLng));
    marker.current.addListener("dragend", (e: { latLng: { lat: () => number; lng: () => number } }) => set(e.latLng));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  function useMyLocation() {
    if (!navigator.geolocation) return setGeoError("Your browser can't share location");
    setLocating(true);
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocating(false);
        const v = { lat: p.coords.latitude, lng: p.coords.longitude };
        onChange(v);
        if (map.current) {
          map.current.setCenter(v);
          map.current.setZoom(17);
          marker.current.setPosition(v);
        }
      },
      () => {
        setLocating(false);
        setGeoError("Couldn't get your location. Allow location access or tap the map instead.");
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  return (
    <div className="stack" style={{ gap: 8 }}>
      <div className="row">
        <button type="button" className="btn secondary" onClick={useMyLocation} disabled={locating}>
          <Icon name={locating ? "loader" : "locate"} className={locating ? "spin" : undefined} />
          {locating ? "Finding you…" : "Use my current location"}
        </button>
        {value && (
          <span className="small muted">
            Pinned at {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
          </span>
        )}
      </div>
      {geoError && <div className="alert">{geoError}</div>}
      {error ? (
        <p className="small muted">{error}. Use the button above while standing at your place of trade.</p>
      ) : (
        <>
          <div ref={el} className="map small" />
          <p className="small muted">Tap the map or drag the pin to the exact spot where learners will find you.</p>
        </>
      )}
    </div>
  );
}
