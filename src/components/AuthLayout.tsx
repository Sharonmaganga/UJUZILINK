import Link from "next/link";
import Logo from "./Logo";
import AuthPhotoPanel from "./auth/AuthPhotoPanel";

/**
 * Fixed-screen split layout shared by /login and /register: photographic panel (desktop)
 * beside the form. On phones the panel is hidden and the logo sits above the form.
 * Sized to the viewport; see the .auth rules in globals.css.
 */
export default function AuthLayout({ title, body, children }: { title: string; body: string; children: React.ReactNode }) {
  return (
    <div className="auth">
      <AuthPhotoPanel title={title} body={body} />
      <div className="auth-main">
        <Link href="/" className="logo auth-brand-mobile" aria-label="Ujuzi Link home">
          <Logo />
        </Link>
        {children}
      </div>
    </div>
  );
}
