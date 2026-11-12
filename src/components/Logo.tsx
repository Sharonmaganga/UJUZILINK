/** Ujuzi Link mark: rounded square with an eight-point spark, as in the Figma brand frames. */
export default function Logo() {
  return (
    <>
      <span className="logo-mark" aria-hidden>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
          <path d="M12 4v16M4 12h16M6.3 6.3l11.4 11.4M17.7 6.3 6.3 17.7" />
        </svg>
      </span>
      <span>Ujuzi Link</span>
    </>
  );
}
