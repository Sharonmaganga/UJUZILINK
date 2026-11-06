import Link from "next/link";
import { getSession } from "@/lib/auth";
import SignOutButton from "./SignOutButton";

export default async function Nav() {
  const session = await getSession();
  const role = session?.user.role;
  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link href="/" className="logo">
          Ujuzi<span>Link</span>
        </Link>
        <nav className="nav-links">
          <Link href="/search">Find a teacher</Link>
          {role === "TEACHER" && <Link href="/dashboard">My dashboard</Link>}
          {role === "ADMIN" && <Link href="/admin">Admin</Link>}
          {session ? (
            <SignOutButton />
          ) : (
            <>
              <Link href="/login">Sign in</Link>
              <Link href="/register?role=TEACHER" className="btn">
                Teach a skill
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
