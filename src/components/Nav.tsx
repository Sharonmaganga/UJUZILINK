import Link from "next/link";
import { getSession } from "@/lib/auth";
import SignOutButton from "./SignOutButton";
import Logo from "./Logo";

export default async function Nav() {
  const session = await getSession();
  const role = session?.user.role;
  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link href="/" className="logo" aria-label="Ujuzi Link home">
          <Logo />
        </Link>
        <form action="/search" className="nav-search" role="search">
          <span aria-hidden>🔍</span>
          <input name="q" placeholder="Search for a skill to learn" aria-label="Search for a skill" />
        </form>
        <nav className="nav-links">
          <Link href="/search" className="hide-sm">
            Find a teacher
          </Link>
          {role === "TEACHER" && <Link href="/dashboard">Dashboard</Link>}
          {role === "ADMIN" && <Link href="/admin">Admin</Link>}
          {session ? (
            <SignOutButton />
          ) : (
            <>
              <Link href="/login">Log in</Link>
              <Link href="/register" className="btn join">
                Join for free
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
