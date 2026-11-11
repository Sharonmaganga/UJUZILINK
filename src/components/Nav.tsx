import Link from "next/link";
import { getSession } from "@/lib/auth";
import SignOutButton from "./SignOutButton";
import Logo from "./Logo";
import Icon from "./Icon";
import NavLink from "./NavLink";
import NavScrollState from "./NavScrollState";

export default async function Nav() {
  const session = await getSession();
  const role = session?.user.role;
  const initials = session?.user.name
    ?.split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const links = (
    <>
      <NavLink href="/skills">Explore Skills</NavLink>
      <NavLink href="/search">Find Teachers</NavLink>
      <Link href="/#how">How it works</Link>
      {role !== "TEACHER" && role !== "ADMIN" && <Link href="/register?role=TEACHER">Become a Teacher</Link>}
      {role === "TEACHER" && <NavLink href="/dashboard">Dashboard</NavLink>}
      {role === "ADMIN" && <NavLink href="/admin">Admin</NavLink>}
    </>
  );

  return (
    <header className="nav">
      <NavScrollState />
      <div className="nav-inner">
        <Link href="/" className="logo" aria-label="Ujuzi Link home">
          <Logo />
        </Link>

        <nav className="nav-links" aria-label="Main">
          {links}
          {session ? (
            <span className="nav-user">
              <span className="nav-avatar" title={session.user.name ?? undefined} aria-hidden>
                {initials}
              </span>
              <SignOutButton />
            </span>
          ) : (
            <span className="nav-actions">
              <Link href="/login" className="btn secondary nav-login">
                Log in
              </Link>
              <Link href="/register" className="btn amber nav-cta">
                Get Started
              </Link>
            </span>
          )}
        </nav>

        <details className="nav-menu">
          <summary aria-label="Menu">
            <Icon name="menu" className="open-ico" />
            <Icon name="x" className="close-ico" />
          </summary>
          <nav className="nav-sheet" aria-label="Main">
            {links}
            {session ? (
              <SignOutButton block />
            ) : (
              <>
                <Link href="/login" className="btn block">Log in</Link>
                <Link href="/register" className="btn secondary block">Create a free account</Link>
              </>
            )}
          </nav>
        </details>
      </div>
    </header>
  );
}
