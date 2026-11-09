"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import MapPicker from "@/components/MapPicker";
import Icon from "@/components/Icon";
import { compressImage } from "@/components/compressImage";
import FileField from "./FileField";

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
  status: string;
} | null;

const local = (p?: string | null) => (p ? `0${p.slice(3)}` : "");

function Section({ n, title, desc, children }: { n: number; title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="card stack" aria-labelledby={`sec-${n}`}>
      <div className="row" style={{ alignItems: "flex-start", gap: 14 }}>
        <span className="icon-tile sm" style={{ fontWeight: 800 }}>{n}</span>
        <div className="grow">
          <h2 id={`sec-${n}`}>{title}</h2>
          {desc && <p className="muted small" style={{ margin: "4px 0 0" }}>{desc}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export default function ProfileForm({ existing, defaultPhone }: { existing: Existing; defaultPhone: string }) {
  const router = useRouter();
  const [loc, setLoc] = useState(existing ? { lat: existing.latitude, lng: existing.longitude } : null);
  const [error, setError] = useState("");
  const [locError, setLocError] = useState("");
  const [loading, setLoading] = useState(false);
  const [bioLen, setBioLen] = useState(existing?.bio.length ?? 0);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!loc) {
      setLocError("Pin the location of your place of trade on the map, or use your current location.");
      document.getElementById("sec-3")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
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
    try {
      const res = await fetch("/api/teacher/profile", { method: "POST", body: form });
      const data = await res.json().catch(() => ({ error: "Upload failed. Try smaller photos." }));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("No connection. Your details are still here; try again when you're back online.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  }

  const approved = existing?.status === "APPROVED";

  return (
    <form className="stack" onSubmit={onSubmit} noValidate={false}>
      {error && (
        <div className="alert" role="alert">
          <Icon name="alert" />
          <div><strong>We couldn&apos;t save your profile</strong><p>{error}</p></div>
        </div>
      )}

      <Section n={1} title="What you teach" desc="This is what learners see first.">
        <label className="field">
          <span>Main skill</span>
          <input name="skill" required minLength={2} defaultValue={existing?.skill} placeholder="e.g. Tailoring" />
        </label>
        <label className="field">
          <span>Other skills <span className="hint">· optional, separated by commas</span></span>
          <input name="otherSkills" defaultValue={existing?.otherSkills.join(", ")} placeholder="e.g. embroidery, pattern making" />
        </label>
        <label className="field">
          <span>Business name <span className="hint">· optional</span></span>
          <input name="businessName" defaultValue={existing?.businessName ?? ""} placeholder="e.g. Mama Wanjiru Designs" />
        </label>
        <label className="field">
          <span>About you</span>
          <span className="hint">Your experience, what learners will learn, and roughly how you charge.</span>
          <textarea name="bio" required minLength={20} defaultValue={existing?.bio} onChange={(e) => setBioLen(e.target.value.length)} />
          <span className="hint tnum" style={{ textAlign: "right" }}>
            {bioLen < 20 ? `${20 - bioLen} more characters needed` : bioLen < 120 ? `${bioLen} characters · 120+ recommended` : `${bioLen} characters`}
          </span>
        </label>
      </Section>

      <Section n={2} title="Contact" desc="Shown only to signed-in learners, never on public pages.">
        <div className="grid-2">
          <label className="field">
            <span>Phone number</span>
            <input name="phone" type="tel" inputMode="tel" autoComplete="tel" required defaultValue={local(existing?.phone) || defaultPhone} placeholder="0712 345 678" />
          </label>
          <label className="field">
            <span>WhatsApp <span className="hint">· optional, if different</span></span>
            <input name="whatsapp" type="tel" inputMode="tel" defaultValue={local(existing?.whatsapp)} placeholder="0712 345 678" />
          </label>
        </div>
      </Section>

      <Section n={3} title="Place of trade" desc="Where learners will come to learn.">
        <label className="field">
          <span>Address or landmark</span>
          <span className="hint">Shown publicly. Use a market, building or landmark, not a home address.</span>
          <input name="address" required minLength={3} defaultValue={existing?.address} placeholder="e.g. Gikomba Market, stall 42" />
        </label>
        <MapPicker value={loc} onChange={(v) => { setLoc(v); setLocError(""); }} />
        {locError && <span className="field-error" role="alert"><Icon name="alert" /> {locError}</span>}
      </Section>

      <Section n={4} title="Verification" desc="These keep learners safe. Your ID is only ever seen by the Ujuzi Link team.">
        <label className="field">
          <span>National ID or passport number</span>
          <input name="idNumber" required minLength={5} defaultValue={existing?.idNumber} autoComplete="off" />
        </label>
        <div className="grid-2" style={{ alignItems: "start" }}>
          <FileField
            name="idPhoto"
            label="Photo of your ID"
            privateNote
            required={!existing?.hasIdPhoto}
            capture="environment"
            existing={existing?.hasIdPhoto ? ["private"] : []}
            existingLabel={existing?.hasIdPhoto ? "On file. Choose a new photo only to replace it." : undefined}
          />
          <FileField
            name="profilePhoto"
            label="Clear photo of yourself"
            required={!existing}
            capture="user"
            existing={existing ? [existing.profilePhotoUrl] : []}
            existingLabel={existing ? "On file. Choose a new photo only to replace it." : undefined}
          />
        </div>
        <FileField
          name="premisesPhotos"
          label="Photos of your premises and work"
          hint={`1 to 6 photos of your workshop, salon, stall or finished work.${existing ? " Choosing new photos replaces the current set." : ""}`}
          multiple
          max={6}
          required={!existing?.premisesPhotoUrls.length}
          existing={existing?.premisesPhotoUrls}
        />
      </Section>

      <div className="card row between" style={{ position: "sticky", bottom: 12, zIndex: 5, boxShadow: "var(--shadow)" }}>
        <span className="small muted">
          {approved ? "Changes go live straight away." : existing ? "Saving sends your profile back for review." : "We'll review your profile, usually within 2 working days."}
        </span>
        <button className="btn lg" disabled={loading}>
          {loading ? <><Icon name="loader" className="spin" /> Uploading…</> : existing ? "Save changes" : "Submit for verification"}
        </button>
      </div>
    </form>
  );
}
