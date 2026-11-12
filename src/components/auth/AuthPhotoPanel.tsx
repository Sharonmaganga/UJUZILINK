import Link from "next/link";
import { existsSync } from "fs";
import path from "path";
import Logo from "../Logo";
import AuthTrustHighlights from "./AuthTrustHighlights";

const photo = (name: string) => (existsSync(path.join(process.cwd(), "public", "images", name)) ? `/images/${name}` : null);
/**
 * The workshop photograph for both auth pages: save it as public/images/auth.jpg.
 * Until that file exists the panel shows the homepage photo as a stand-in.
 */
const AUTH_PHOTO = photo("auth.jpg") ?? photo("hero.jpg");

/** Left panel of the auth pages: brand, headline, supporting text and trust highlights over the photo. */
export default function AuthPhotoPanel({ title, body }: { title: string; body: string }) {
  return (
    <aside className={`auth-aside${AUTH_PHOTO ? " has-photo" : ""}`}>
      {AUTH_PHOTO && <div className="auth-photo" style={{ backgroundImage: `url(${AUTH_PHOTO})` }} aria-hidden />}
      <div className="auth-aside-grid">
        <Link href="/" className="logo auth-logo" aria-label="Ujuzi Link home">
          <Logo />
        </Link>
        <div className="auth-aside-inner">
          <span className="eyebrow">Ujuzi Link</span>
          <p className="auth-headline">{title}</p>
          <svg className="auth-swoosh" viewBox="0 0 200 20" preserveAspectRatio="none" aria-hidden>
            <path d="M3 16 C 60 4, 130 2, 197 6" />
          </svg>
          <p className="auth-lead">{body}</p>
          <AuthTrustHighlights />
        </div>
      </div>
    </aside>
  );
}
