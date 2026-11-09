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
      title="Great skills are closer than you think."
      body="Join free to contact verified teachers near you, or list your own skill and start teaching."
    >
      <RegisterForm initialRole={role === "TEACHER" ? "TEACHER" : "LEARNER"} callbackUrl={safeCallback(callbackUrl)} />
    </AuthLayout>
  );
}
