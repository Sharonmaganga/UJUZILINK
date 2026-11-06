"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterForm({ initialRole }: { initialRole: "LEARNER" | "TEACHER" }) {
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
    router.push(role === "TEACHER" ? "/dashboard/profile" : "/search");
    router.refresh();
  }

  return (
    <form className="card stack" onSubmit={onSubmit}>
      <h1>Create your account</h1>
      <div className="row" role="radiogroup" aria-label="Account type">
        <button
          type="button"
          className={role === "LEARNER" ? "btn" : "btn secondary"}
          onClick={() => setRole("LEARNER")}
          aria-pressed={role === "LEARNER"}
        >
          I want to learn
        </button>
        <button
          type="button"
          className={role === "TEACHER" ? "btn" : "btn secondary"}
          onClick={() => setRole("TEACHER")}
          aria-pressed={role === "TEACHER"}
        >
          I want to teach
        </button>
      </div>
      <p className="small muted">
        {role === "LEARNER"
          ? "Learners use Ujuzi Link for free."
          : "Teachers get the first month free, then KES 500/month. You'll be asked for your ID, location and photos next."}
      </p>
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
      <button className="btn" disabled={loading}>
        {loading ? "Creating account..." : "Create account"}
      </button>
      <p className="small muted">
        Already have an account? <Link href="/login">Sign in</Link>
      </p>
    </form>
  );
}
