import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { homeForRole, safeCallback } from "@/lib/routing";
import AuthLayout from "@/components/AuthLayout";
import RegisterForm from "./RegisterForm";

export const metadata = { title: "Join Ujuzi Link" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; callbackUrl?: string }>;
}) {
  const { role, callbackUrl } = await searchParams;
  const session = await getSession();
  if (session) redirect(safeCallback(callbackUrl) ?? homeForRole(session.user.role));

  return (
    <AuthLayout
      title="Your next chapter starts with a skill."
      body="Join Ujuzi Link to discover verified teachers near you or share your skills with your community."
    >
      <RegisterForm initialRole={role === "TEACHER" ? "TEACHER" : "LEARNER"} callbackUrl={safeCallback(callbackUrl)} />
    </AuthLayout>
  );
}
