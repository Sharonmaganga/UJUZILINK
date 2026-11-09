import Link from "next/link";
import { getSession } from "@/lib/auth";
import SignOutButton from "./SignOutButton";
import Logo from "./Logo";
import Icon from "./Icon";
import NavLink from "./NavLink";

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
      <NavLink href="/search">Find a teacher</NavLink>
      <Link href="/#how">How it works</Link>
      {role !== "TEACHER" && role !== "ADMIN" && <Link href="/#teach">Become a teacher</Link>}
      {role === "TEACHER" && <NavLink href="/dashboard">Dashboard</NavLink>}
      {role === "ADMIN" && <NavLink href="/admin">Admin</NavLink>}
    </>
  );

  return (
    <header className="nav">
      <div className="container nav-inner">
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
            <>
              <Link href="/login">Log in</Link>
              <Link href="/register" className="btn sm">
                Join free
              </Link>
            </>
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
                <Link href="/login">Log in</Link>
                <Link href="/register" className="btn block">
                  Join free
                </Link>
              </>
            )}
          </nav>
        </details>
      </div>
    </header>
  );
}
