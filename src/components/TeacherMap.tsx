"use client";
import { useEffect, useRef } from "react";
import { useGoogleMaps } from "./useGoogleMaps";

type Pin = { id: string; name: string; skill: string; latitude: number; longitude: number };

export default function TeacherMap({
  center,
  teachers,
  onSelect,
}: {
  center: { lat: number; lng: number };
  teachers: Pin[];
  onSelect?: (id: string) => void;
}) {
  const { ready, error } = useGoogleMaps();
  const el = useRef<HTMLDivElement>(null);
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const map = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const me = useRef<any>(null);
  /* eslint-enable @typescript-eslint/no-explicit-any */

  useEffect(() => {
    if (!ready || !el.current) return;
    const g = window.google.maps;
    if (!map.current) {
      map.current = new g.Map(el.current, { center, zoom: 13, streetViewControl: false, mapTypeControl: false });
    }
    map.current.setCenter(center);

    me.current?.setMap(null);
    me.current = new g.Marker({
      map: map.current,
      position: center,
      title: "You",
      icon: { path: g.SymbolPath.CIRCLE, scale: 8, fillColor: "#1a73e8", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2 },
    });

    markers.current.forEach((m) => m.setMap(null));
    const bounds = new g.LatLngBounds();
    bounds.extend(center);
    markers.current = teachers.map((t) => {
      const pos = { lat: t.latitude, lng: t.longitude };
      bounds.extend(pos);
      const m = new g.Marker({ map: map.current, position: pos, title: `${t.name}: ${t.skill}` });
      m.addListener("click", () => onSelect?.(t.id));
      return m;
    });
    if (teachers.length) map.current.fitBounds(bounds, 60);
  }, [ready, center, teachers, onSelect]);

  if (error) return <div className="map map-off muted small">🗺️<br />{error}</div>;
  return <div ref={el} className="map" />;
}
