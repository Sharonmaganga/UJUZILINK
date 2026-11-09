import Icon from "./Icon";

/** Two-column auth layout: brand panel (desktop) and the form. */
export default function AuthLayout({ title, body, children }: { title: string; body: string; children: React.ReactNode }) {
  return (
    <div className="auth">
      <aside className="auth-aside" aria-hidden>
        <span className="eyebrow" style={{ color: "var(--amber)" }}>Ujuzi Link</span>
        <div className="stack" style={{ position: "relative", zIndex: 1 }}>
          <h2>{title}</h2>
          <p>{body}</p>
          <ul className="checks" style={{ marginTop: 12 }}>
            <li><Icon name="check" /> Teachers checked by a real person</li>
            <li><Icon name="check" /> Free for learners, always</li>
            <li><Icon name="check" /> Pay teachers directly, no middleman</li>
          </ul>
        </div>
        <span className="small" style={{ color: "rgba(255,255,255,0.6)", position: "relative", zIndex: 1 }}>
          Your ID and contact details are never shown publicly.
        </span>
        <div className="arch-deco" />
      </aside>
      <div className="auth-main">{children}</div>
    </div>
  );
}
