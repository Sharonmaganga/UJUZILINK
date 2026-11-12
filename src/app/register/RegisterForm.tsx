"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/Icon";
import PasswordInput from "@/components/PasswordInput";
import AuthFormContainer from "@/components/auth/AuthFormContainer";
import AuthInput from "@/components/auth/AuthInput";
import AuthButton from "@/components/auth/AuthButton";
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

  // Each field shows its own validation message under it, linked with aria-describedby
  const a11y = (f: Field) => ({ id: `reg-${f}`, "aria-invalid": !!fieldErrors[f], "aria-describedby": fieldErrors[f] ? `reg-${f}-err` : undefined });
  const fieldError = (f: Field) => ({ error: fieldErrors[f], errorId: `reg-${f}-err` });

  return (
    // method="post" so a submit before hydration can never put the password in the URL
    <AuthFormContainer
      heading="Create your account"
      subtitle={
        <>
          Already a member? <Link href={`/login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`} className="link">Log in</Link>
        </>
      }
      onSubmit={onSubmit}
      noValidate
      method="post"
    >
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
          <p style={{ margin: 0 }}>Verification is required. Next you&apos;ll add your ID, a photo, and photos and the location of your place of trade. Your first month is free once approved.</p>
        </div>
      )}
      {error && (
        <div className="alert" role="alert"><Icon name="alert" /><p style={{ margin: 0 }}>{error}</p></div>
      )}

      <AuthInput label="Full name" icon="user" name="name" autoComplete="name" placeholder="Enter your full name" {...a11y("name")} {...fieldError("name")} />
      <AuthInput
        label="Email"
        icon="mail"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="Enter your email address"
        {...a11y("email")}
        {...fieldError("email")}
      />
      <AuthInput
        label={<>Phone number <span className="hint">· optional</span></>}
        icon="phone"
        name="phone"
        type="tel"
        autoComplete="tel"
        inputMode="tel"
        placeholder="0712 345 678"
        {...a11y("phone")}
        {...fieldError("phone")}
      />
      <AuthInput
        label="Password"
        control={<PasswordInput name="password" autoComplete="new-password" placeholder="Create a password" {...a11y("password")} />}
        hint="At least 8 characters."
        {...fieldError("password")}
      />
      <AuthButton loading={loading} loadingLabel="Creating account…">
        {role === "TEACHER" ? "Create account and continue" : "Create free account"}
      </AuthButton>
      {role === "LEARNER" && (
        <p className="xs muted auth-footnote">
          Learners never pay Ujuzi Link. You pay teachers directly, once you&apos;ve met and agreed.
        </p>
      )}
    </AuthFormContainer>
  );
}
