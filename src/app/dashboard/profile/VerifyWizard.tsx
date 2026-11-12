"use client";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import MapPicker from "@/components/MapPicker";
import Icon from "@/components/Icon";
import { compressImage } from "@/components/compressImage";
import { CATEGORIES } from "@/lib/skills";
import { STEPS, validateStep, type Errors, type TeacherFields } from "@/lib/teacherForm";
import FileField from "./FileField";

type Photos = { hasIdPhoto: boolean; profilePhotoUrl: string | null; premisesPhotoUrls: string[] };
type Status = "INCOMPLETE" | "PENDING" | "APPROVED" | "REJECTED" | null;

/** POST multipart with upload progress (fetch can't report upload progress). */
function postWithProgress(url: string, body: FormData, onProgress: (pct: number) => void) {
  return new Promise<{ status: number; data: Record<string, unknown> }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      let data: Record<string, unknown> = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        data = { error: xhr.status === 413 ? "Those photos are too large together. Try fewer or smaller photos." : "Something went wrong. Please try again." };
      }
      resolve({ status: xhr.status, data });
    };
    xhr.onerror = () => reject(new Error("network"));
    xhr.send(body);
  });
}

const maskId = (id?: string) => (id ? `•••• ${id.slice(-4)}` : "–");

export default function VerifyWizard({
  initialStep,
  initialFields,
  initialPhotos,
  email,
  status,
  rejectionReason,
  teacherId,
  trialDays,
  price,
}: {
  initialStep: number;
  initialFields: TeacherFields;
  initialPhotos: Photos;
  email: string;
  status: Status;
  rejectionReason: string | null;
  teacherId: string | null;
  trialDays: number;
  price: number;
}) {
  const router = useRouter();
  const [step, setStep] = useState(initialStep);
  const [fields, setFields] = useState<TeacherFields>(initialFields);
  const [photos, setPhotos] = useState<Photos>(initialPhotos);
  const [pending, setPending] = useState<{ idPhoto: File[]; profilePhoto: File[]; premisesPhotos: File[] }>({ idPhoto: [], profilePhoto: [], premisesPhotos: [] });
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [done, setDone] = useState<null | "PENDING" | "APPROVED">(null);
  const top = useRef<HTMLDivElement>(null);

  const photoState = useMemo(
    () => ({
      hasIdPhoto: photos.hasIdPhoto || pending.idPhoto.length > 0,
      hasProfilePhoto: !!photos.profilePhotoUrl || pending.profilePhoto.length > 0,
      premisesCount: pending.premisesPhotos.length || photos.premisesPhotoUrls.length,
    }),
    [photos, pending],
  );
  const stepValid = (n: number) => Object.keys(validateStep(n, fields, photoState)).length === 0;
  const reachable = (n: number) => n <= step || [1, 2, 3, 4].filter((s) => s < n).every(stepValid);

  const set = (k: keyof TeacherFields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFields((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  function go(n: number) {
    setStep(n);
    setErrors({});
    setServerError("");
    window.history.replaceState(null, "", `/dashboard/profile?step=${n}`);
    requestAnimationFrame(() => top.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function focusFirstError(errs: Errors) {
    const first = Object.keys(errs)[0];
    if (first) requestAnimationFrame(() => document.getElementById(`v-${first}`)?.focus());
  }

  async function saveAndContinue(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateStep(step, fields, photoState);
    setErrors(errs);
    setServerError("");
    if (Object.keys(errs).length) return focusFirstError(errs);

    setBusy(true);
    const body = new FormData();
    body.set("step", String(step));
    for (const [k, v] of Object.entries(fields)) if (v !== undefined && v !== null) body.set(k, String(v));
    const files = [...pending.idPhoto.map((f) => ["idPhoto", f] as const), ...pending.profilePhoto.map((f) => ["profilePhoto", f] as const), ...pending.premisesPhotos.map((f) => ["premisesPhotos", f] as const)];
    if (files.length) setProgress(0);
    for (const [k, f] of files) body.append(k, await compressImage(f));

    try {
      const { status: code, data } = await postWithProgress("/api/teacher/draft", body, setProgress);
      if (code === 400 && data.errors) {
        setErrors(data.errors as Errors);
        focusFirstError(data.errors as Errors);
      } else if (code !== 200) {
        setServerError(String(data.error ?? "Couldn't save. Please try again."));
      } else {
        const d = data.draft as { hasIdPhoto: boolean; profilePhotoUrl: string | null; premisesPhotoUrls: string[] };
        setPhotos((p) => ({
          hasIdPhoto: d.hasIdPhoto || p.hasIdPhoto,
          profilePhotoUrl: d.profilePhotoUrl ?? p.profilePhotoUrl,
          premisesPhotoUrls: d.premisesPhotoUrls.length ? d.premisesPhotoUrls : p.premisesPhotoUrls,
        }));
        setPending({ idPhoto: [], profilePhoto: [], premisesPhotos: [] });
        go(step + 1);
      }
    } catch {
      setServerError("No connection. Your details are still here; try again when you're back online.");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateStep(5, fields, photoState);
    if (Object.keys(errs).length) {
      setErrors(errs);
      const firstStep = [1, 2, 3, 4].find((n) => !stepValid(n)) ?? 1;
      setServerError(`Some details are missing. Check step ${firstStep}: ${STEPS[firstStep - 1].label}.`);
      return;
    }
    if (!confirmed) {
      setServerError("Please confirm that your details are true and belong to you.");
      return;
    }
    setBusy(true);
    setServerError("");
    const body = new FormData();
    for (const [k, v] of Object.entries(fields)) if (v !== undefined && v !== null && v !== "") body.set(k, String(v));
    try {
      const res = await fetch("/api/teacher/profile", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setServerError(data.error ?? "Couldn't submit. Please try again.");
        return;
      }
      setDone(data.status === "APPROVED" ? "APPROVED" : "PENDING");
      router.refresh();
      requestAnimationFrame(() => top.current?.scrollIntoView({ behavior: "smooth" }));
    } catch {
      setServerError("No connection. Nothing was lost; try again when you're back online.");
    } finally {
      setBusy(false);
    }
  }

  const meta = STEPS[step - 1];
  const err = (k: keyof Errors) =>
    errors[k] && (
      <span className="field-error" id={`v-${k}-err`}>
        <Icon name="alert" /> {errors[k]}
      </span>
    );
  const a11y = (k: keyof Errors) => ({ id: `v-${k}`, "aria-invalid": !!errors[k], "aria-describedby": errors[k] ? `v-${k}-err` : undefined });

  if (done) {
    return (
      <div ref={top} className="verify-done card">
        <span className="icon-tile" style={{ width: 64, height: 64 }}><Icon name="check" /></span>
        <h2>{done === "APPROVED" ? "Changes saved" : "Submitted for review"}</h2>
        <p className="muted">
          {done === "APPROVED"
            ? "You're still verified and your listing has been updated."
            : `Our team will check your ID, photos and location, usually within 2 working days. Your free ${trialDays}-day listing starts the day you're approved.`}
        </p>
        <ol className="timeline" style={{ textAlign: "left", maxWidth: 360, margin: "8px auto 0" }}>
          <li className="done"><span className="tl-dot"><Icon name="check" /></span><div><strong>Profile submitted</strong><span className="d">Just now</span></div></li>
          <li className={done === "APPROVED" ? "done" : "current"}><span className="tl-dot"><Icon name="eye" /></span><div><strong>Review by our team</strong><span className="d">{done === "APPROVED" ? "Approved" : "In progress"}</span></div></li>
          <li className={done === "APPROVED" ? "done" : ""}><span className="tl-dot"><Icon name="shield" /></span><div><strong>Listed for learners</strong><span className="d">{trialDays} days free, then KES {price} / month</span></div></li>
        </ol>
        <div className="row" style={{ justifyContent: "center", marginTop: 8 }}>
          <Link href="/dashboard" className="btn">Go to dashboard</Link>
          {teacherId && <Link href={`/teachers/${teacherId}`} className="btn secondary">Preview profile</Link>}
        </div>
      </div>
    );
  }

  return (
    <div ref={top} className="verify">
      <ol className="verify-tabs" aria-label="Verification steps">
        {STEPS.map((s) => {
          const state = s.n === step ? "current" : s.n < step || (s.n < 5 && stepValid(s.n) && reachable(s.n)) ? "done" : "";
          return (
            <li key={s.n}>
              <button type="button" className={`verify-tab ${state}`} onClick={() => reachable(s.n) && go(s.n)} disabled={!reachable(s.n)} aria-current={s.n === step ? "step" : undefined}>
                <span className="n">{String(s.n).padStart(2, "0")}</span> {s.label}
              </button>
            </li>
          );
        })}
      </ol>
      <div className="verify-progress" aria-hidden>
        <div className="progress"><span style={{ width: `${(step / 5) * 100}%` }} /></div>
        <span>Step {step} of 5 · {meta.label}</span>
      </div>

      {status === "REJECTED" && (
        <div className="alert" style={{ marginBottom: 16 }}>
          <Icon name="alert" />
          <div><strong>Changes requested by our team</strong><p>{rejectionReason ?? "Your documents could not be verified."} Update the relevant step and submit again.</p></div>
        </div>
      )}
      {status === "PENDING" && (
        <div className="alert info" style={{ marginBottom: 16 }}>
          <Icon name="clock" />
          <div><strong>Your profile is under review</strong><p>You can still update it. Submitting again sends the latest version to our team.</p></div>
        </div>
      )}
      {status === "APPROVED" && (
        <div className="alert ok" style={{ marginBottom: 16 }}>
          <Icon name="shield" />
          <div><strong>You&apos;re verified</strong><p>Changes you submit here go live on your profile straight away.</p></div>
        </div>
      )}

      <div className="verify-grid">
        <form className="card verify-card" onSubmit={step === 5 ? submit : saveAndContinue} noValidate>
          <div>
            <h2>Step {step} of 5 <span className="dot">•</span> {meta.title}</h2>
            <p className="muted small" style={{ margin: "6px 0 0" }}>
              {["Tell learners who you are and what you teach.", "Private: only seen by Ujuzi Link admins, never by learners.", "Where learners will come to learn. Learners only see the town until they sign in.", "Show your workplace and work. These photos appear on your public profile.", "Check everything, then submit for verification."][step - 1]}
            </p>
          </div>

          {serverError && (
            <div className="alert" role="alert"><Icon name="alert" /><p style={{ margin: 0 }}>{serverError}</p></div>
          )}

          {step === 1 && (
            <>
              <label className="field">
                <span>Full legal name</span>
                <input {...a11y("name")} value={fields.name ?? ""} onChange={set("name")} placeholder="Enter your legal full name" autoComplete="name" />
                {err("name")}
              </label>
              <label className="field">
                <span>Teaching skill</span>
                <input {...a11y("skill")} value={fields.skill ?? ""} onChange={set("skill")} placeholder="Choose or type your primary skill" list="skill-options" autoComplete="off" />
                <datalist id="skill-options">
                  {CATEGORIES.map((c) => <option key={c.slug} value={c.name} />)}
                </datalist>
                {err("skill")}
              </label>
              <label className="field">
                <span>Short introduction</span>
                <span className="hint">Your teaching experience, what learners will learn, and roughly how you charge.</span>
                <textarea {...a11y("bio")} value={fields.bio ?? ""} onChange={set("bio")} placeholder="Describe your teaching experience" />
                <span className="hint tnum" style={{ textAlign: "right" }}>{(fields.bio ?? "").length} / 2000</span>
                {err("bio")}
              </label>
              <div className="grid-2">
                <label className="field">
                  <span>Other skills <span className="hint">· optional</span></span>
                  <input value={fields.otherSkills ?? ""} onChange={set("otherSkills")} placeholder="e.g. embroidery, pattern making" />
                </label>
                <label className="field">
                  <span>Business name <span className="hint">· optional</span></span>
                  <input value={fields.businessName ?? ""} onChange={set("businessName")} placeholder="e.g. Mama Wanjiru Designs" />
                </label>
              </div>
              <div className="grid-2">
                <label className="field">
                  <span>Phone number</span>
                  <input {...a11y("phone")} type="tel" inputMode="tel" autoComplete="tel" value={fields.phone ?? ""} onChange={set("phone")} placeholder="07XX XXX XXX" />
                  <span className="hint">Shown to signed-in learners only.</span>
                  {err("phone")}
                </label>
                <label className="field">
                  <span>WhatsApp <span className="hint">· optional</span></span>
                  <input {...a11y("whatsapp")} type="tel" inputMode="tel" value={fields.whatsapp ?? ""} onChange={set("whatsapp")} placeholder="If different" />
                  {err("whatsapp")}
                </label>
              </div>
              <label className="field">
                <span>Email</span>
                <input value={email} readOnly aria-readonly className="readonly" />
                <span className="hint">Your account email. Never shown publicly.</span>
              </label>
            </>
          )}

          {step === 2 && (
            <>
              <label className="field">
                <span>National ID or passport number</span>
                <input {...a11y("idNumber")} value={fields.idNumber ?? ""} onChange={set("idNumber")} autoComplete="off" inputMode="text" placeholder="e.g. 12345678" />
                {err("idNumber")}
              </label>
              <div className="grid-2" style={{ alignItems: "start" }}>
                <div id="v-idPhoto" tabIndex={-1}>
                  <FileField
                    name="idPhoto"
                    label="Photo of your ID"
                    privateNote
                    capture="environment"
                    existing={photos.hasIdPhoto ? ["private"] : []}
                    existingLabel={photos.hasIdPhoto ? "On file. Choose a new photo only to replace it." : "All four corners visible, no glare"}
                    onFiles={(f) => { setPending((p) => ({ ...p, idPhoto: f })); setErrors((e) => ({ ...e, idPhoto: undefined })); }}
                    error={errors.idPhoto}
                  />
                </div>
                <div id="v-profilePhoto" tabIndex={-1}>
                  <FileField
                    name="profilePhoto"
                    label="Clear photo of yourself"
                    capture="user"
                    existing={photos.profilePhotoUrl ? [photos.profilePhotoUrl] : []}
                    existingLabel={photos.profilePhotoUrl ? "On file. Choose a new photo only to replace it." : "Face the camera in good light"}
                    onFiles={(f) => { setPending((p) => ({ ...p, profilePhoto: f })); setErrors((e) => ({ ...e, profilePhoto: undefined })); }}
                    error={errors.profilePhoto}
                  />
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <label className="field">
                <span>Address or landmark</span>
                <span className="hint">Use a market, building or landmark, not a home address.</span>
                <input {...a11y("address")} value={fields.address ?? ""} onChange={set("address")} placeholder="e.g. Gikomba Market, stall 42" />
                {err("address")}
              </label>
              <div id="v-latitude" tabIndex={-1}>
                <MapPicker
                  value={fields.latitude !== undefined && fields.latitude !== "" ? { lat: Number(fields.latitude), lng: Number(fields.longitude) } : null}
                  onChange={(v) => { setFields((f) => ({ ...f, latitude: v.lat, longitude: v.lng })); setErrors((e) => ({ ...e, latitude: undefined })); }}
                />
              </div>
              {err("latitude")}
            </>
          )}

          {step === 4 && (
            <div id="v-premisesPhotos" tabIndex={-1}>
              <FileField
                name="premisesPhotos"
                label="Photos of your premises and work"
                hint={`1 to 6 photos: your workshop, salon, stall or finished work.${photos.premisesPhotoUrls.length ? " Choosing new photos replaces the current set." : ""}`}
                multiple
                max={6}
                existing={photos.premisesPhotoUrls}
                onFiles={(f) => { setPending((p) => ({ ...p, premisesPhotos: f })); setErrors((e) => ({ ...e, premisesPhotos: undefined })); }}
                error={errors.premisesPhotos}
              />
            </div>
          )}

          {step === 5 && (
            <div className="review">
              {[
                { n: 1, title: "Your details", rows: [["Name", fields.name], ["Skill", fields.skill], ["Other skills", fields.otherSkills || "–"], ["Business", fields.businessName || "–"], ["Phone", fields.phone], ["WhatsApp", fields.whatsapp || "Same as phone"], ["Introduction", fields.bio]] },
                { n: 2, title: "Identity", rows: [["ID number", maskId(fields.idNumber)], ["ID photo", photos.hasIdPhoto ? "Uploaded · admins only" : "Missing"], ["Profile photo", photos.profilePhotoUrl ? "Uploaded" : "Missing"]] },
                { n: 3, title: "Location", rows: [["Address", fields.address], ["Pin", fields.latitude !== undefined && fields.latitude !== "" ? `${Number(fields.latitude).toFixed(4)}, ${Number(fields.longitude).toFixed(4)}` : "Missing"]] },
                { n: 4, title: "Premises", rows: [["Photos", `${photos.premisesPhotoUrls.length} photo${photos.premisesPhotoUrls.length === 1 ? "" : "s"}`]] },
              ].map((s) => (
                <section key={s.n} className={`review-block${stepValid(s.n) ? "" : " invalid"}`}>
                  <div className="row between">
                    <h3>{s.n}. {s.title} {!stepValid(s.n) && <span className="badge red">Incomplete</span>}</h3>
                    <button type="button" className="btn ghost sm" onClick={() => go(s.n)}>Edit</button>
                  </div>
                  <dl className="kv">
                    {s.rows.map(([k, v]) => (
                      <div key={k} style={{ display: "contents" }}><dt>{k}</dt><dd className={k === "Introduction" ? "clamp-3" : undefined}>{v || "–"}</dd></div>
                    ))}
                  </dl>
                  {s.n === 2 && photos.profilePhotoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photos.profilePhotoUrl} alt="Your profile photo" className="avatar" style={{ marginTop: 10 }} />
                  )}
                  {s.n === 4 && photos.premisesPhotoUrls.length > 0 && (
                    <div className="thumbs" style={{ marginTop: 10 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {photos.premisesPhotoUrls.map((u) => <img key={u} src={u} alt="" />)}
                    </div>
                  )}
                </section>
              ))}
              <label className="confirm">
                <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
                <span>I confirm these details are true, the ID is mine, and the photos show where I teach.</span>
              </label>
            </div>
          )}

          <div className="alert ok small" style={{ marginTop: 4 }}>
            <Icon name="lock" />
            <p style={{ margin: 0 }}>Private identity documents are only visible to authorized admins.</p>
          </div>

          {progress !== null && (
            <div className="upload-progress" role="status" aria-live="polite">
              <div className="row between small"><span>Uploading photos…</span><span className="tnum">{progress}%</span></div>
              <div className="progress"><span style={{ width: `${progress}%` }} /></div>
            </div>
          )}

          <div className="verify-actions">
            {step > 1 ? (
              <button type="button" className="btn secondary" onClick={() => go(step - 1)} disabled={busy}>
                <Icon name="arrowLeft" /> Back
              </button>
            ) : <span />}
            <button className="btn lg" disabled={busy}>
              {busy ? <><Icon name="loader" className="spin" /> {step === 5 ? "Submitting…" : "Saving…"}</> : step === 5 ? (status === "APPROVED" ? "Save changes" : "Submit for verification") : <>Save &amp; continue <Icon name="arrow" /></>}
            </button>
          </div>
        </form>

        <aside className="verify-aside">
          <div className="need-card">
            <h2>What you will need</h2>
            <ul className="checks">
              <li><Icon name="check" /> Valid ID number and a clear ID photo</li>
              <li><Icon name="check" /> A profile photograph</li>
              <li><Icon name="check" /> Pinned teaching location</li>
              <li><Icon name="check" /> Photos of your premises or workplace</li>
              <li><Icon name="check" /> Administrator approval</li>
            </ul>
          </div>
          <div className="card free-card">
            <h2>Your first month is free</h2>
            <p className="muted small">Your free {trialDays}-day listing period starts after approval.</p>
            <div className="then">
              <strong>Then KES {price} / month</strong>
              <span className="muted xs">Pay by M-Pesa to stay featured.</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
