import { existsSync } from "fs";
import path from "path";
import Icon from "./Icon";

const photo = (name: string) => (existsSync(path.join(process.cwd(), "public", "images", name)) ? `/images/${name}` : null);
/** Drop a licensed photo at public/images/auth.jpg to override the panel; falls back to the homepage photo. */
const AUTH_PHOTO = photo("auth.jpg") ?? photo("hero.jpg");

/**
 * Fixed-screen auth layout: photographic brand panel (desktop) beside the form.
 * Sized to the viewport below the nav; see the .auth rules in globals.css.
 */
export default function AuthLayout({ title, body, children }: { title: string; body: string; children: React.ReactNode }) {
  return (
    <div className="auth">
      <aside className={`auth-aside${AUTH_PHOTO ? " has-photo" : ""}`} aria-hidden>
        {AUTH_PHOTO && <div className="auth-photo" style={{ backgroundImage: `url(${AUTH_PHOTO})` }} />}
        <div className="auth-aside-inner">
          <span className="eyebrow">Ujuzi Link</span>
          <h2>{title}</h2>
          <svg className="auth-swoosh" viewBox="0 0 200 20" preserveAspectRatio="none" aria-hidden>
            <path d="M3 16 C 60 4, 130 2, 197 6" />
          </svg>
          <p>{body}</p>
          <ul className="auth-benefits">
            <li><span className="auth-benefit-icon"><Icon name="shield" /></span> Teachers checked by a real person</li>
            <li><span className="auth-benefit-icon"><Icon name="users" /></span> Free for learners, always</li>
            <li><span className="auth-benefit-icon"><Icon name="cash" /></span> Pay teachers directly, no middleman</li>
          </ul>
        </div>
      </aside>
      <div className="auth-main">{children}</div>
    </div>
  );
}
