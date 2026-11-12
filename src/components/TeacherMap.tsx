"use client";
import { useEffect, useRef } from "react";
import { useGoogleMaps } from "./useGoogleMaps";
import Icon from "./Icon";

type Pin = { id: string; name: string; skill: string; latitude: number; longitude: number };

const PIN_PATH = "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z";
const pinIcon = (g: any, active: boolean) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
  path: PIN_PATH,
  fillColor: active ? "#F4A340" : "#174C3C",
  fillOpacity: 1,
  strokeColor: "#ffffff",
  strokeWeight: 2,
  scale: active ? 1.9 : 1.5,
  anchor: new g.Point(12, 22),
  labelOrigin: new g.Point(12, 9),
});

const MAP_STYLES = [
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
  { featureType: "poi", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "water", stylers: [{ color: "#cfe3d8" }] },
  { featureType: "landscape", stylers: [{ color: "#f4f3ee" }] },
];

/**
 * Google map of teacher pins. Falls back to a message (the list keeps working) when Maps can't load.
 * `activeId` highlights a pin (e.g. the hovered card); clicking a pin calls `onSelect`.
 */
export default function TeacherMap({
  center,
  teachers,
  onSelect,
  activeId,
  showCenter = true,
  zoom = 13,
}: {
  center: { lat: number; lng: number };
  teachers: Pin[];
  onSelect?: (id: string) => void;
  activeId?: string | null;
  showCenter?: boolean;
  zoom?: number;
}) {
  const { ready, error } = useGoogleMaps();
  const el = useRef<HTMLDivElement>(null);
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const map = useRef<any>(null);
  const markers = useRef<Map<string, any>>(new Map());
  const me = useRef<any>(null);
  /* eslint-enable @typescript-eslint/no-explicit-any */
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!ready || !el.current) return;
    const g = window.google.maps;
    if (!map.current) {
      map.current = new g.Map(el.current, {
        center,
        zoom,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
        clickableIcons: false,
        styles: MAP_STYLES,
      });
    }
    map.current.setCenter(center);

    me.current?.setMap(null);
    if (showCenter) {
      me.current = new g.Marker({
        map: map.current,
        position: center,
        title: "Search centre",
        zIndex: 1,
        icon: { path: g.SymbolPath.CIRCLE, scale: 7, fillColor: "#1a73e8", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 3 },
      });
    }

    markers.current.forEach((m) => m.setMap(null));
    markers.current.clear();
    const bounds = new g.LatLngBounds();
    if (showCenter) bounds.extend(center);
    teachers.forEach((t) => {
      const pos = { lat: t.latitude, lng: t.longitude };
      bounds.extend(pos);
      const m = new g.Marker({ map: map.current, position: pos, title: `${t.name}: ${t.skill}`, icon: pinIcon(g, false), zIndex: 2 });
      m.addListener("click", () => onSelectRef.current?.(t.id));
      markers.current.set(t.id, m);
    });
    if (teachers.length > (showCenter ? 0 : 1)) map.current.fitBounds(bounds, 64);
    else map.current.setZoom(zoom);
  }, [ready, center, teachers, showCenter, zoom]);

  useEffect(() => {
    if (!ready) return;
    const g = window.google.maps;
    markers.current.forEach((m, id) => {
      const active = id === activeId;
      m.setIcon(pinIcon(g, active));
      m.setZIndex(active ? 10 : 2);
    });
  }, [ready, activeId, teachers]);

  if (error) {
    return (
      <div className="map map-off" role="note">
        <div className="stack-sm" style={{ alignItems: "center" }}>
          <span className="icon-tile">
            <Icon name="map" />
          </span>
          <strong style={{ color: "var(--ink)" }}>Map unavailable</strong>
          <span className="small">The list still shows every teacher, nearest first.</span>
        </div>
      </div>
    );
  }
  return <div ref={el} className="map" role="region" aria-label="Map of teachers" />;
}
