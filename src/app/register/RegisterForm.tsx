"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/Icon";
import PasswordInput from "@/components/PasswordInput";
import { normaliseKenyanPhone } from "@/lib/phone";

type Field = "name" | "email" | "phone" | "password";

// Mirrors the server rules in /api/register so learners get instant, specific feedback.
function validate(form: FormData): Partial<Record<Field, string>> {
  const errors: Partial<Record<Field, string>> = {};
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const phone = String(form.get("phone") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (name.length < 2) errors.name = "Enter your full name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email, like name@example.com.";
  if (phone && !normaliseKenyanPhone(phone)) errors.phone = "Enter a Kenyan number, like 0712 345 678.";
  if (password.length < 8) errors.password = "Use at least 8 characters.";
  return errors;
}

export default function RegisterForm({
  initialRole,
  callbackUrl,
}: {
  initialRole: "LEARNER" | "TEACHER";
  callbackUrl: string | null;
}) {
  const router = useRouter();
  const [role, setRole] = useState(initialRole);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Field, string>>>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const errs = validate(form);
    setFieldErrors(errs);
    setError("");
    const firstBad = Object.keys(errs)[0];
    if (firstBad) {
      document.getElementById(`reg-${firstBad}`)?.focus();
      return;
    }
    setLoading(true);
    const body = Object.fromEntries(form.entries());
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      const login = await signIn("credentials", { email: body.email, password: body.password, redirect: false });
      if (login?.error) return router.push("/login?registered=1");
      router.push(role === "TEACHER" ? "/dashboard/profile" : callbackUrl ?? "/search");
      router.refresh();
    } catch {
      setError("No connection. Check your internet and try again.");
    } finally {
      setLoading(false);
    }
  }

  const err = (f: Field) =>
    fieldErrors[f] && (
      <span className="field-error" id={`reg-${f}-err`}>
        <Icon name="alert" /> {fieldErrors[f]}
      </span>
    );
  const a11y = (f: Field) => ({ id: `reg-${f}`, "aria-invalid": !!fieldErrors[f], "aria-describedby": fieldErrors[f] ? `reg-${f}-err` : undefined });

  return (
    // method="post" so a submit before hydration can never put the password in the URL
    <form className="auth-card" onSubmit={onSubmit} noValidate method="post">
      <div>
        <h1>Create your account</h1>
        <p className="muted" style={{ margin: "8px 0 0" }}>
          Already a member? <Link href={`/login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`} className="link">Log in</Link>
        </p>
      </div>

      <div className="segmented" role="radiogroup" aria-label="I want to">
        <button type="button" role="radio" aria-checked={role === "LEARNER"} onClick={() => setRole("LEARNER")}>
          <Icon name="graduation" /> I want to learn
        </button>
        <button type="button" role="radio" aria-checked={role === "TEACHER"} onClick={() => setRole("TEACHER")}>
          <Icon name="store" /> I want to teach
        </button>
      </div>
      {role === "TEACHER" && (
        <div className="alert ok small">
          <Icon name="shield" />
          <p style={{ margin: 0 }}>Next you&apos;ll add your ID, a photo, photos of your place of trade and its location. Your first month is free once approved.</p>
        </div>
      )}
      {error && (
        <div className="alert" role="alert"><Icon name="alert" /><p style={{ margin: 0 }}>{error}</p></div>
      )}

      <label className="field">
        <span>Full name</span>
        <div className="input-wrap has-icon">
          <Icon name="user" className="input-icon" />
          <input name="name" autoComplete="name" placeholder="Enter your full name" {...a11y("name")} />
        </div>
        {err("name")}
      </label>
      <label className="field">
        <span>Email</span>
        <div className="input-wrap has-icon">
          <Icon name="mail" className="input-icon" />
          <input name="email" type="email" autoComplete="email" inputMode="email" placeholder="Enter your email address" {...a11y("email")} />
        </div>
        {err("email")}
      </label>
      <label className="field">
        <span>Phone number <span className="hint">· optional</span></span>
        <div className="input-wrap has-icon">
          <Icon name="phone" className="input-icon" />
          <input name="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="0712 345 678" {...a11y("phone")} />
        </div>
        {err("phone")}
      </label>
      <label className="field">
        <span>Password</span>
        <PasswordInput name="password" autoComplete="new-password" placeholder="Create a password" {...a11y("password")} />
        {err("password") || <span className="hint">At least 8 characters.</span>}
      </label>
      <button className="btn lg block" disabled={loading}>
        {loading ? <><Icon name="loader" className="spin" /> Creating account…</> : role === "TEACHER" ? "Create account and continue" : "Create free account"}
      </button>
      {role === "LEARNER" && (
        <p className="xs muted auth-footnote">
          Learners never pay Ujuzi Link. You pay teachers directly, once you&apos;ve met and agreed.
        </p>
      )}
    </form>
  );
}
