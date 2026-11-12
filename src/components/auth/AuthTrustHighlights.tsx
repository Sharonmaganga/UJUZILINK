import Icon, { type IconName } from "../Icon";

const HIGHLIGHTS: { icon: IconName; text: string }[] = [
  { icon: "shield", text: "Teachers checked by a real person" },
  { icon: "users", text: "Free for learners, always" },
  { icon: "cash", text: "Pay teachers directly, no middleman" },
];

/** The three trust points shown on the photographic panel of both auth pages. */
export default function AuthTrustHighlights() {
  return (
    <ul className="auth-benefits">
      {HIGHLIGHTS.map((h) => (
        <li key={h.text}>
          <span className="auth-benefit-icon" aria-hidden>
            <Icon name={h.icon} />
          </span>
          {h.text}
        </li>
      ))}
    </ul>
  );
}
