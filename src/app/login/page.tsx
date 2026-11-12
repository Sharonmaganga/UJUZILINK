import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { homeForRole, safeCallback } from "@/lib/routing";
import AuthLayout from "@/components/AuthLayout";
import LoginForm from "./LoginForm";

export const metadata = { title: "Log in · Ujuzi Link" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; registered?: string }>;
}) {
  const sp = await searchParams;
  const callbackUrl = safeCallback(sp.callbackUrl);
  const session = await getSession();
  if (session) redirect(callbackUrl ?? homeForRole(session.user.role));

  return (
    <AuthLayout title="Welcome back to your neighbourhood of skills." body="Log in to contact teachers, manage your teaching profile or review verifications.">
      <LoginForm callbackUrl={callbackUrl} registered={sp.registered === "1"} />
    </AuthLayout>
  );
}
