import RegisterForm from "./RegisterForm";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; callbackUrl?: string }>;
}) {
  const { role, callbackUrl } = await searchParams;
  const safe = callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : null;
  return (
    <div className="auth-wrap">
      <RegisterForm initialRole={role === "TEACHER" ? "TEACHER" : "LEARNER"} callbackUrl={safe} />
    </div>
  );
}
