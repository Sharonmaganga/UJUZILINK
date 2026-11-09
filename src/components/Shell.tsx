import Link from "next/link";
import Icon, { type IconName } from "./Icon";

export type ShellItem = { href: string; label: string; icon: IconName; key: string; count?: number; external?: boolean };

/** Sidebar layout shared by the teacher and admin workspaces. */
export default function Shell({
  title,
  items,
  active,
  children,
}: {
  title: string;
  items: ShellItem[];
  active: string;
  children: React.ReactNode;
}) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-title">{title}</div>
        <nav aria-label={title}>
          {items.map((i) => (
            <Link key={i.key} href={i.href} aria-current={i.key === active ? "page" : undefined}>
              <Icon name={i.icon} />
              {i.label}
              {!!i.count && <span className="count">{i.count}</span>}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="shell-main">{children}</div>
    </div>
  );
}

export const teacherNav = (teacherId?: string): ShellItem[] => [
  { key: "overview", href: "/dashboard", label: "Overview", icon: "dashboard" },
  { key: "profile", href: "/dashboard/profile?step=1", label: "My profile", icon: "user" },
  { key: "verification", href: "/dashboard/profile?step=5", label: "Verification", icon: "shield" },
  { key: "photos", href: "/dashboard/profile?step=4", label: "Photos", icon: "image" },
  { key: "subscription", href: "/dashboard#subscription", label: "Subscription", icon: "cash" },
  { key: "payments", href: "/dashboard#payments", label: "Payments", icon: "history" },
  ...(teacherId ? [{ key: "public", href: `/teachers/${teacherId}`, label: "Public page", icon: "eye" as const }] : []),
];
