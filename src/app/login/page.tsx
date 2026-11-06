import LoginForm from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; registered?: string }>;
}) {
  const sp = await searchParams;
  // Only allow redirects back into this site.
  const callbackUrl = sp.callbackUrl?.startsWith("/") && !sp.callbackUrl.startsWith("//") ? sp.callbackUrl : "/";
  return (
    <div className="container narrow">
      <LoginForm callbackUrl={callbackUrl} registered={sp.registered === "1"} />
    </div>
  );
}
