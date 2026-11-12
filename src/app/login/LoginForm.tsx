"use client";
import { useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/Icon";
import PasswordInput from "@/components/PasswordInput";
import AuthFormContainer from "@/components/auth/AuthFormContainer";
import AuthInput from "@/components/auth/AuthInput";
import AuthButton from "@/components/auth/AuthButton";
import { homeForRole } from "@/lib/routing";

export default function LoginForm({ callbackUrl, registered }: { callbackUrl: string | null; registered: boolean }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const res = await signIn("credentials", {
        email: String(form.get("email") ?? "").trim(),
        password: form.get("password"),
        redirect: false,
      });
      if (res?.error) {
        setError("That email and password don't match an account. Check them and try again.");
        return;
      }
      const session = await getSession();
      router.push(callbackUrl ?? homeForRole(session?.user.role));
      router.refresh();
    } catch {
      setError("No connection. Check your internet and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    // method="post" so a submit before hydration can never put credentials in the URL
    <AuthFormContainer
      heading="Log in"
      subtitle={
        <>
          New to Ujuzi Link? <Link href={`/register${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`} className="link">Create a free account</Link>
        </>
      }
      onSubmit={onSubmit}
      method="post"
    >
      {registered && (
        <div className="alert ok" role="status"><Icon name="check" /><p style={{ margin: 0 }}>Account created. Log in to continue.</p></div>
      )}
      {error && (
        <div className="alert" role="alert"><Icon name="alert" /><p style={{ margin: 0 }}>{error}</p></div>
      )}
      <AuthInput
        label="Email"
        icon="mail"
        name="email"
        type="email"
        required
        autoComplete="email"
        inputMode="email"
        placeholder="Enter your email address"
        aria-invalid={!!error}
      />
      <AuthInput
        label="Password"
        control={<PasswordInput name="password" required autoComplete="current-password" placeholder="Enter your password" aria-invalid={!!error} />}
      />
      <AuthButton loading={loading} loadingLabel="Logging in…">Log in</AuthButton>
    </AuthFormContainer>
  );
}
