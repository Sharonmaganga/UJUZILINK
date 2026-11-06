"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import MapPicker from "@/components/MapPicker";
import { compressImage } from "@/components/compressImage";

type Existing = {
  skill: string;
  otherSkills: string[];
  bio: string;
  phone: string;
  whatsapp: string | null;
  businessName: string | null;
  address: string;
  latitude: number;
  longitude: number;
  idNumber: string;
  hasIdPhoto: boolean;
  profilePhotoUrl: string;
  premisesPhotoUrls: string[];
} | null;

const local = (p?: string | null) => (p ? `0${p.slice(3)}` : "");

export default function ProfileForm({ existing, defaultPhone }: { existing: Existing; defaultPhone: string }) {
  const router = useRouter();
  const [loc, setLoc] = useState(existing ? { lat: existing.latitude, lng: existing.longitude } : null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!loc) return setError("Pin the location of your place of trade on the map");
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    form.set("latitude", String(loc.lat));
    form.set("longitude", String(loc.lng));
    for (const key of ["idPhoto", "profilePhoto", "premisesPhotos"]) {
      const files = form.getAll(key).filter((v): v is File => v instanceof File && v.size > 0);
      form.delete(key);
      for (const f of files) form.append(key, await compressImage(f));
    }
    const res = await fetch("/api/teacher/profile", { method: "POST", body: form });
    const data = await res.json().catch(() => ({ error: "Upload failed. Try smaller photos." }));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form className="stack" onSubmit={onSubmit}>
      {error && <div className="alert">{error}</div>}

      <div className="card stack">
        <h2>What you teach</h2>
        <label>
          Main skill
          <input name="skill" required defaultValue={existing?.skill} placeholder="e.g. Tailoring" />
        </label>
        <label>
          Other skills <span className="hint">Optional, separated by commas</span>
          <input name="otherSkills" defaultValue={existing?.otherSkills.join(", ")} placeholder="e.g. embroidery, pattern making" />
        </label>
        <label>
          Business name <span className="hint">Optional</span>
          <input name="businessName" defaultValue={existing?.businessName ?? ""} />
        </label>
        <label>
          About you
          <span className="hint">Your experience, what learners will learn, and roughly how you charge</span>
          <textarea name="bio" required minLength={20} defaultValue={existing?.bio} />
        </label>
      </div>

      <div className="card stack">
        <h2>Contact</h2>
        <label>
          Phone number
          <input name="phone" type="tel" required defaultValue={local(existing?.phone) || defaultPhone} placeholder="0712 345 678" />
        </label>
        <label>
          WhatsApp number <span className="hint">Optional, if different</span>
          <input name="whatsapp" type="tel" defaultValue={local(existing?.whatsapp)} />
        </label>
      </div>

      <div className="card stack">
        <h2>Location of your place of trade</h2>
        <label>
          Address or landmark
          <input name="address" required defaultValue={existing?.address} placeholder="e.g. Gikomba Market, stall 42" />
        </label>
        <MapPicker value={loc} onChange={setLoc} />
      </div>

      <div className="card stack">
        <h2>Verification</h2>
        <p className="small muted">
          These keep learners safe. Your ID number and ID photo are only seen by the Ujuzi Link team, never by learners.
        </p>
        <label>
          National ID or passport number
          <input name="idNumber" required defaultValue={existing?.idNumber} />
        </label>
        <label>
          Photo of your ID {existing?.hasIdPhoto && <span className="hint">Already uploaded. Choose a file only to replace it.</span>}
          <input name="idPhoto" type="file" accept="image/*" required={!existing?.hasIdPhoto} />
        </label>
        <label>
          Clear photo of yourself
          {existing && <span className="hint">Already uploaded. Choose a file only to replace it.</span>}
          <input name="profilePhoto" type="file" accept="image/*" capture="user" required={!existing} />
        </label>
        <label>
          Photos of your premises or place of trade <span className="hint">1 to 6 photos{existing ? ". Choosing new ones replaces the old set." : ""}</span>
          <input name="premisesPhotos" type="file" accept="image/*" multiple required={!existing?.premisesPhotoUrls.length} />
        </label>
      </div>

      <div>
        <button className="btn" disabled={loading}>
          {loading ? "Uploading..." : existing ? "Save changes" : "Submit for verification"}
        </button>
      </div>
    </form>
  );
}
