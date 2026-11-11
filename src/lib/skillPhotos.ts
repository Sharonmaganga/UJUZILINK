/**
 * Category photographs for the Explore Skills cards, keyed by category slug (see CATEGORIES in ./skills).
 *
 * All photos are from Pexels under the Pexels License (https://www.pexels.com/license/):
 * free for commercial use and modification, attribution not required (credited here anyway).
 * The licence does not allow implying that the people shown endorse Ujuzi Link, so these are used
 * only to illustrate a skill category, never as a teacher's own photo.
 * Files live in public/images/skills/ as WebP (long edge 1600px, original aspect ratio);
 * `focus` is the CSS object-position used when the card crops them to 16:10.
 */
export type SkillPhoto = {
  src: string;
  alt: string;
  focus: string;
  photographer: string;
  source: string;
};

export const SKILL_PHOTOS: Record<string, SkillPhoto> = {
  "auto-mechanics": {
    src: "/images/skills/auto-mechanics.webp",
    alt: "Two young mechanics repairing a car engine together in Mozambique",
    focus: "50% 45%",
    photographer: "dionisio castigotivane",
    source: "https://www.pexels.com/photo/african-mechanics-28153669/",
  },
  tailoring: {
    src: "/images/skills/tailoring.webp",
    alt: "A tailor in Maiduguri, Nigeria, sewing patterned fabric at his sewing machine",
    focus: "50% 70%",
    photographer: "Ishaka Ali",
    source: "https://www.pexels.com/photo/photo-of-a-man-sewing-11645428/",
  },
  "hair-beauty": {
    src: "/images/skills/hair-beauty.webp",
    alt: "A hairdresser in Gulu, Uganda, styling a young client's hair in her salon",
    focus: "55% 45%",
    photographer: "illustrate Digital Ug",
    source: "https://www.pexels.com/photo/hairdresser-in-africa-making-a-hair-extension-20853654/",
  },
  "digital-skills": {
    src: "/images/skills/digital-skills.webp",
    alt: "A smiling man working on a laptop at a wooden desk",
    focus: "55% 40%",
    photographer: "Tima Miroshnichenko",
    source: "https://www.pexels.com/photo/man-using-a-laptop-5198239/",
  },
  carpentry: {
    src: "/images/skills/carpentry.webp",
    alt: "A carpenter in safety glasses working a wooden plank at his workshop bench",
    focus: "60% 40%",
    photographer: "Tima Miroshnichenko",
    source: "https://www.pexels.com/photo/carpenter-holding-a-wood-plank-6790933/",
  },
  cooking: {
    src: "/images/skills/cooking.webp",
    alt: "A chef in Uganda cooking over high flames in a busy kitchen",
    focus: "45% 55%",
    photographer: "Karl Rayson",
    source: "https://www.pexels.com/photo/chef-cooking-on-fire-14621560/",
  },
  photography: {
    src: "/images/skills/photography.webp",
    alt: "A photographer in Abuja holding his camera during an outdoor shoot",
    focus: "50% 35%",
    photographer: "Muhammad-Taha Ibrahim",
    source: "https://www.pexels.com/photo/professional-photographer-in-outdoor-setting-abuja-30517381/",
  },
  electrical: {
    src: "/images/skills/electrical-skills.webp",
    alt: "An electrician on a ladder working with cables during an indoor installation",
    focus: "40% 45%",
    photographer: "Audy of Course",
    source: "https://www.pexels.com/photo/a-female-electrician-standing-on-a-ladder-and-holding-cables-20500461/",
  },
  welding: {
    src: "/images/skills/welding.webp",
    alt: "A welder in goggles and leather gloves welding a metal pipe as sparks fly",
    focus: "50% 38%",
    photographer: "Mad Knoxx Deluxe",
    source: "https://www.pexels.com/photo/skilled-welder-wearing-safety-gear-welding-metal-39712846/",
  },
  plumbing: {
    src: "/images/skills/plumbing.webp",
    alt: "A plumber's hands fitting brass and steel pipes under a sink",
    focus: "50% 45%",
    photographer: "Anıl Karakaya",
    source: "https://www.pexels.com/photo/plumber-installs-pipe-fittings-6419128/",
  },
  music: {
    src: "/images/skills/music.webp",
    alt: "A musician with dreadlocks playing an acoustic guitar in a studio",
    focus: "50% 50%",
    photographer: "Brett Sayles",
    source: "https://www.pexels.com/photo/focused-black-man-playing-guitar-in-studio-4031039/",
  },
  farming: {
    src: "/images/skills/farming.webp",
    alt: "Farmers picking ripe tomatoes in a green vegetable garden",
    focus: "50% 45%",
    photographer: "Zen Chung",
    source: "https://www.pexels.com/photo/anonymous-local-female-farmers-picking-vegetables-during-harvesting-season-in-garden-5529604/",
  },
};
