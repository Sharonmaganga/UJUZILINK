import type { IconName } from "@/components/Icon";

/** Popular skill categories shown as shortcuts on the home and search pages. `name` is the search term. */
export const CATEGORIES: { name: string; icon: IconName; sub: string; tone: "sage" | "amber" }[] = [
  { name: "Tailoring", icon: "scissors", sub: "Fashion · Dressmaking", tone: "sage" },
  { name: "Hairdressing", icon: "brush", sub: "Salon · Braiding", tone: "amber" },
  { name: "Mechanics", icon: "wrench", sub: "Motor · Repairs", tone: "sage" },
  { name: "Coding", icon: "laptop", sub: "Web · Digital skills", tone: "amber" },
  { name: "Baking", icon: "cake", sub: "Pastry · Cakes", tone: "sage" },
  { name: "Carpentry", icon: "hammer", sub: "Furniture · Joinery", tone: "amber" },
  { name: "Beauty", icon: "sparkles", sub: "Nails · Make-up", tone: "sage" },
  { name: "Photography", icon: "camera", sub: "Photo · Video", tone: "amber" },
  { name: "Welding", icon: "flame", sub: "Metalwork · Fabrication", tone: "sage" },
  { name: "Music", icon: "music", sub: "Instruments · Voice", tone: "amber" },
  { name: "Farming", icon: "sprout", sub: "Agribusiness · Gardens", tone: "sage" },
  { name: "Cooking", icon: "pot", sub: "Catering · Cuisine", tone: "amber" },
];

export function iconForSkill(skill: string): IconName {
  const s = skill.toLowerCase();
  return CATEGORIES.find((c) => s.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(s))?.icon ?? "graduation";
}
