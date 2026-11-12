/** The form card on the right of the auth pages: heading, a line of context, then the fields. */
export default function AuthFormContainer({
  heading,
  subtitle,
  children,
  ...form
}: Omit<React.FormHTMLAttributes<HTMLFormElement>, "className"> & { heading: string; subtitle: React.ReactNode }) {
  return (
    <form className="auth-card" {...form}>
      <div>
        <h1>{heading}</h1>
        <p className="muted auth-sub">{subtitle}</p>
      </div>
      {children}
    </form>
  );
}
