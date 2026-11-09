import Link from "next/link";
import Logo from "./Logo";
import { CATEGORIES } from "@/lib/skills";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link href="/" className="logo on-dark">
              <Logo />
            </Link>
            <p className="small" style={{ marginTop: 16 }}>
              Removing the financial and physical barriers to learning, one neighbourhood at a time.
            </p>
          </div>
          <div>
            <h4>Popular skills</h4>
            <ul>
              {CATEGORIES.slice(0, 6).map((c) => (
                <li key={c.name}>
                  <Link href={`/search?q=${encodeURIComponent(c.name)}`}>{c.name}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Learners</h4>
            <ul>
              <li><Link href="/search">Find a teacher</Link></li>
              <li><Link href="/register">Join for free</Link></li>
              <li><Link href="/#how">How it works</Link></li>
              <li><Link href="/#trust">How we verify</Link></li>
              <li><Link href="/#faq">FAQs</Link></li>
            </ul>
          </div>
          <div>
            <h4>Teachers</h4>
            <ul>
              <li><Link href="/register?role=TEACHER">Become a teacher</Link></li>
              <li><Link href="/dashboard">Teacher dashboard</Link></li>
              <li><Link href="/#teach">Pricing</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Ujuzi Link · Nairobi, Kenya</span>
          <span>Learners pay teachers directly. Ujuzi Link never handles lesson payments.</span>
        </div>
      </div>
    </footer>
  );
}
