"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginForm({ callbackUrl, registered }: { callbackUrl: string; registered: boolean }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false,
    });
    setLoading(false);
    if (res?.error) return setError("Wrong email or password");
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form className="card stack" onSubmit={onSubmit}>
      <h1>Sign in</h1>
      {registered && <div className="alert ok">Account created. Sign in to continue.</div>}
      {error && <div className="alert">{error}</div>}
      <label>
        Email
        <input name="email" type="email" required autoComplete="email" />
      </label>
      <label>
        Password
        <input name="password" type="password" required autoComplete="current-password" />
      </label>
      <button className="btn" disabled={loading}>
        {loading ? "Signing in..." : "Sign in"}
      </button>
      <p className="small muted">
        New here? <Link href="/register">Create a free account</Link>
      </p>
    </form>
  );
}
