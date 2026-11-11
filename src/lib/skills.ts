import type { IconName } from "@/components/Icon";

export type Category = {
  slug: string;
  name: string;
  sub: string;
  icon: IconName;
  tone: "sage" | "amber" | "sand" | "mist";
  /** Lower-case stems matched against a teacher's skill, other skills, bio and business name. */
  terms: string[];
};

/** Skill categories (Figma "Browse by skill"). Search matches any of a category's terms. */
export const CATEGORIES: Category[] = [
  { slug: "auto-mechanics", name: "Auto mechanics", sub: "Maintenance · Diagnostics", icon: "car", tone: "sage", terms: ["mechanic", "motor", "garage", "auto", "vehicle"] },
  { slug: "tailoring", name: "Tailoring", sub: "Sewing · Alterations", icon: "scissors", tone: "amber", terms: ["tailor", "sewing", "dressmak", "fashion", "embroider"] },
  { slug: "hair-beauty", name: "Hair & beauty", sub: "Styling · Braiding", icon: "sparkles", tone: "sand", terms: ["hair", "salon", "braid", "beauty", "nail", "makeup", "barber"] },
  { slug: "digital-skills", name: "Digital skills", sub: "Coding · Design", icon: "laptop", tone: "mist", terms: ["coding", "web", "computer", "digital", "programming", "graphic"] },
  { slug: "carpentry", name: "Carpentry", sub: "Woodwork · Joinery", icon: "hammer", tone: "sand", terms: ["carpent", "wood", "joiner", "furniture"] },
  { slug: "cooking", name: "Cooking", sub: "Baking · Food craft", icon: "pot", tone: "amber", terms: ["cook", "bak", "catering", "pastry", "chef", "cake"] },
  { slug: "photography", name: "Photography", sub: "Cameras · Editing", icon: "camera", tone: "mist", terms: ["photo", "video", "camera", "film"] },
  { slug: "electrical", name: "Electrical skills", sub: "Installation · Repair", icon: "zap", tone: "sage", terms: ["electric", "wiring", "solar", "electronics"] },
  { slug: "welding", name: "Welding", sub: "Metalwork · Fabrication", icon: "flame", tone: "amber", terms: ["weld", "metal", "fabricat"] },
  { slug: "plumbing", name: "Plumbing", sub: "Pipes · Fittings", icon: "droplet", tone: "mist", terms: ["plumb", "pipe"] },
  { slug: "music", name: "Music", sub: "Instruments · Voice", icon: "music", tone: "sand", terms: ["music", "guitar", "piano", "sing", "instrument", "drum"] },
  { slug: "farming", name: "Farming", sub: "Agribusiness · Gardens", icon: "sprout", tone: "sage", terms: ["farm", "agri", "garden", "poultry", "livestock"] },
];

export function categoryBySlug(slug?: string | null) {
  return CATEGORIES.find((c) => c.slug === slug) ?? null;
}

/** Link to teacher search for a category (the search page resolves the slug to its terms). */
export const categoryHref = (c: Category) => `/search?skill=${c.slug}`;

export function matchesCategory(c: Category, ...texts: (string | null | undefined)[]) {
  const hay = texts.filter(Boolean).join(" ").toLowerCase();
  return c.terms.some((t) => hay.includes(t));
}

export function categoryForSkill(skill: string) {
  return CATEGORIES.find((c) => matchesCategory(c, skill)) ?? null;
}

export function iconForSkill(skill: string): IconName {
  return categoryForSkill(skill)?.icon ?? "graduation";
}
