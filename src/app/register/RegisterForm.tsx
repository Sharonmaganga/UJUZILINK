"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const body = Object.fromEntries(form.entries());
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, role }),
    });
    const data = await res.json();
    if (!res.ok) {
      setLoading(false);
      return setError(data.error ?? "Something went wrong");
    }
    const login = await signIn("credentials", { email: body.email, password: body.password, redirect: false });
    setLoading(false);
    if (login?.error) return router.push("/login?registered=1");
    router.push(role === "TEACHER" ? "/dashboard/profile" : callbackUrl ?? "/search");
    router.refresh();
  }

  return (
    <form className="card stack auth-card" onSubmit={onSubmit}>
      <div>
        <h1 style={{ marginBottom: 4 }}>Join Ujuzi Link</h1>
        <p className="muted" style={{ margin: 0 }}>Free for learners. Teachers get their first month free.</p>
      </div>
      <div className="segmented" role="radiogroup" aria-label="Account type">
        <button type="button" onClick={() => setRole("LEARNER")} aria-pressed={role === "LEARNER"}>
          🎓 I want to learn
        </button>
        <button type="button" onClick={() => setRole("TEACHER")} aria-pressed={role === "TEACHER"}>
          🧰 I want to teach
        </button>
      </div>
      {role === "TEACHER" && (
        <div className="alert ok small">
          After signing up you&apos;ll add your ID, location, a photo of yourself and photos of your place of trade.
        </div>
      )}
      {error && <div className="alert">{error}</div>}
      <label>
        Full name
        <input name="name" required autoComplete="name" />
      </label>
      <label>
        Email
        <input name="email" type="email" required autoComplete="email" />
      </label>
      <label>
        Phone number <span className="hint">Optional, e.g. 0712 345 678</span>
        <input name="phone" type="tel" autoComplete="tel" />
      </label>
      <label>
        Password <span className="hint">At least 8 characters</span>
        <input name="password" type="password" required minLength={8} autoComplete="new-password" />
      </label>
      <button className="btn brand lg block" disabled={loading}>
        {loading ? "Creating account..." : "Create free account"}
      </button>
      <p className="small muted">
        Already have an account? <Link href="/login" className="link">Log in</Link>
      </p>
    </form>
  );
}
