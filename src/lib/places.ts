import { distanceKm } from "./geo";

/** Town centres used as a search starting point and to describe a teacher's area without exposing the exact pin. */
export const PLACES = [
  { slug: "nairobi", name: "Nairobi", lat: -1.2864, lng: 36.8172 },
  { slug: "mombasa", name: "Mombasa", lat: -4.0435, lng: 39.6682 },
  { slug: "kisumu", name: "Kisumu", lat: -0.0917, lng: 34.768 },
  { slug: "nakuru", name: "Nakuru", lat: -0.3031, lng: 36.08 },
  { slug: "eldoret", name: "Eldoret", lat: 0.5143, lng: 35.2698 },
  { slug: "thika", name: "Thika", lat: -1.0333, lng: 37.0693 },
  { slug: "machakos", name: "Machakos", lat: -1.5177, lng: 37.2634 },
  { slug: "nyeri", name: "Nyeri", lat: -0.4201, lng: 36.9476 },
] as const;

export type Place = (typeof PLACES)[number];
export const DEFAULT_PLACE: Place = PLACES[0];

export function placeBySlug(slug?: string | null): Place | null {
  return PLACES.find((p) => p.slug === slug) ?? null;
}

/** Approximate public area for a point, e.g. "Nairobi, Kenya" (falls back to "Kenya" far from any listed town). */
export function areaLabel(lat: number, lng: number) {
  let best: { p: Place; d: number } | null = null;
  for (const p of PLACES) {
    const d = distanceKm(lat, lng, p.lat, p.lng);
    if (!best || d < best.d) best = { p, d };
  }
  return best && best.d <= 60 ? `${best.p.name}, Kenya` : "Kenya";
}
