"use client";
import { useEffect, useState } from "react";
import Icon from "@/components/Icon";

const MAX_BYTES = 15 * 1024 * 1024; // before in-browser compression; the server enforces 5 MB after it
const OK_TYPES = /^image\/(jpeg|png|webp|heic|heif)$/;

/** A file input with a drop-zone look, live previews and client-side checks (the server re-validates). */
export default function FileField({
  name,
  label,
  hint,
  multiple,
  max = 1,
  required,
  capture,
  existing = [],
  existingLabel,
  privateNote,
}: {
  name: string;
  label: string;
  hint?: string;
  multiple?: boolean;
  max?: number;
  required?: boolean;
  capture?: "user" | "environment";
  existing?: string[];
  existingLabel?: string;
  privateNote?: boolean;
}) {
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState("");
  const id = `f-${name}`;

  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setError("");
    if (files.length > max) {
      setError(`Choose at most ${max} photos.`);
      e.target.value = "";
      setPreviews([]);
      return;
    }
    const bad = files.find((f) => !OK_TYPES.test(f.type) && !/\.(heic|heif)$/i.test(f.name));
    if (bad) {
      setError(`${bad.name} isn't a photo. Use JPG, PNG, WEBP or HEIC.`);
      e.target.value = "";
      setPreviews([]);
      return;
    }
    const big = files.find((f) => f.size > MAX_BYTES);
    if (big) {
      setError(`${big.name} is too large. Choose a photo under 15 MB.`);
      e.target.value = "";
      setPreviews([]);
      return;
    }
    setPreviews(files.map((f) => URL.createObjectURL(f)));
  }

  const showing = previews.length ? previews : existing;

  return (
    <div className="field">
      <span id={`${id}-label`}>
        {label} {privateNote && <span className="badge amber" style={{ marginLeft: 6 }}><Icon name="lock" /> Admins only</span>}
      </span>
      {hint && <span className="hint">{hint}</span>}
      <label className="drop" htmlFor={id}>
        <Icon name="upload" />
        <strong className="small">{previews.length ? `${previews.length} photo${previews.length === 1 ? "" : "s"} selected` : multiple ? "Choose photos" : "Choose a photo"}</strong>
        <span className="hint">{existingLabel && !previews.length ? existingLabel : "Tap to take or pick from your gallery"}</span>
        <input
          id={id}
          name={name}
          type="file"
          accept="image/*"
          multiple={multiple}
          required={required}
          capture={capture}
          onChange={onChange}
          aria-labelledby={`${id}-label`}
          aria-invalid={!!error}
        />
      </label>
      {error && <span className="field-error" role="alert"><Icon name="alert" /> {error}</span>}
      {showing.length > 0 && (
        <div className="thumbs">
          {showing.map((src) =>
            src === "private" ? (
              <div key={src} className="thumb-empty"><Icon name="idcard" /></div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={src} src={src} alt="" />
            ),
          )}
        </div>
      )}
    </div>
  );
}
