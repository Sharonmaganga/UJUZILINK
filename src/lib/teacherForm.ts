import { normaliseKenyanPhone } from "./phone";

/** Text fields of the five-step verification form. Shared by the wizard (client) and the draft API (server). */
export type TeacherFields = {
  name?: string;
  skill?: string;
  otherSkills?: string;
  businessName?: string;
  bio?: string;
  phone?: string;
  whatsapp?: string;
  idNumber?: string;
  address?: string;
  latitude?: number | string;
  longitude?: number | string;
};

export type PhotoState = { hasIdPhoto: boolean; hasProfilePhoto: boolean; premisesCount: number };

export const FIELD_LIMITS: Record<keyof TeacherFields, number> = {
  name: 100, skill: 60, otherSkills: 300, businessName: 100, bio: 2000, phone: 20, whatsapp: 20,
  idNumber: 20, address: 200, latitude: 32, longitude: 32,
};

export const STEPS = [
  { n: 1, key: "details", label: "Your details", title: "Teacher information", fields: ["name", "skill", "otherSkills", "businessName", "bio", "phone", "whatsapp"] },
  { n: 2, key: "identity", label: "Identity", title: "Identity verification", fields: ["idNumber"] },
  { n: 3, key: "location", label: "Location", title: "Teaching location", fields: ["address", "latitude", "longitude"] },
  { n: 4, key: "premises", label: "Premises", title: "Premises and work photos", fields: [] },
  { n: 5, key: "review", label: "Review", title: "Review and submit", fields: [] },
] as const;

export type Errors = Partial<Record<keyof TeacherFields | "idPhoto" | "profilePhoto" | "premisesPhotos", string>>;

const str = (v: unknown) => (typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim());

/** Validation for one step (1–4), or everything (5). Mirrors the rules enforced by /api/teacher/profile. */
export function validateStep(step: number, f: TeacherFields, photos: PhotoState): Errors {
  const e: Errors = {};
  if (step === 1 || step === 5) {
    if (str(f.name).length < 2) e.name = "Enter your full legal name.";
    if (str(f.skill).length < 2) e.skill = "Choose or type the main skill you teach.";
    if (str(f.bio).length < 20) e.bio = "Tell learners a bit more (at least 20 characters).";
    if (!normaliseKenyanPhone(str(f.phone))) e.phone = "Enter a Kenyan phone number, like 0712 345 678.";
    if (str(f.whatsapp) && !normaliseKenyanPhone(str(f.whatsapp))) e.whatsapp = "Enter a valid WhatsApp number, or leave it blank.";
  }
  if (step === 2 || step === 5) {
    const id = str(f.idNumber);
    if (id.length < 5 || !/^[A-Za-z0-9]+$/.test(id)) e.idNumber = "Enter your national ID or passport number (letters and digits only).";
    if (!photos.hasIdPhoto) e.idPhoto = "Upload a clear photo of your ID.";
    if (!photos.hasProfilePhoto) e.profilePhoto = "Upload a clear photo of yourself.";
  }
  if (step === 3 || step === 5) {
    if (str(f.address).length < 3) e.address = "Enter the address or a landmark for your place of trade.";
    const lat = Number(f.latitude), lng = Number(f.longitude);
    if (str(f.latitude) === "" || !Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lng) || Math.abs(lng) > 180) {
      e.latitude = "Pin your place of trade on the map, or use your current location.";
    }
  }
  if (step === 4 || step === 5) {
    if (photos.premisesCount < 1) e.premisesPhotos = "Add at least one photo of your premises or work.";
    if (photos.premisesCount > 6) e.premisesPhotos = "Use at most 6 photos.";
  }
  return e;
}

/** Keeps only known fields, trimmed and length-capped. */
export function cleanFields(input: Record<string, unknown>): TeacherFields {
  const out: Record<string, string> = {};
  for (const k of Object.keys(FIELD_LIMITS) as (keyof TeacherFields)[]) {
    if (input[k] === undefined || input[k] === null) continue;
    out[k] = str(input[k]).slice(0, FIELD_LIMITS[k]);
  }
  return out as TeacherFields;
}
