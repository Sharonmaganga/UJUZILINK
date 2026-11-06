import RegisterForm from "./RegisterForm";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const { role } = await searchParams;
  return (
    <div className="container narrow">
      <RegisterForm initialRole={role === "TEACHER" ? "TEACHER" : "LEARNER"} />
    </div>
  );
}
