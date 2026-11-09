/** Town centres used as a search starting point when the learner doesn't share their location. */
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
