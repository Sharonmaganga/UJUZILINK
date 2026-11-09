"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** A link that marks itself as the current page for assistive tech and styling. */
export default function NavLink({
  href,
  children,
  className,
  exact,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const path = href.split(/[?#]/)[0];
  const current = exact ? pathname === path : pathname === path || pathname.startsWith(`${path}/`);
  return (
    <Link href={href} className={className} aria-current={current && path !== "/" ? "page" : undefined}>
      {children}
    </Link>
  );
}
