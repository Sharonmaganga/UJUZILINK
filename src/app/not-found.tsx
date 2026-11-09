import Link from "next/link";
import Icon from "@/components/Icon";

export default function NotFound() {
  return (
    <div className="container page" style={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
      <div className="state" style={{ maxWidth: 520, alignItems: "center", textAlign: "center" }}>
        <span className="icon-tile"><Icon name="search" /></span>
        <h1 style={{ fontSize: "1.8rem" }}>We couldn&apos;t find that page</h1>
        <p>The teacher may no longer be listed, or the link is wrong.</p>
        <div className="row" style={{ justifyContent: "center" }}>
          <Link href="/search" className="btn">Find a teacher</Link>
          <Link href="/" className="btn secondary">Go home</Link>
        </div>
      </div>
    </div>
  );
}
