export default function Loading() {
  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 96 }} aria-busy="true" aria-label="Loading skills">
      <div className="skeleton" style={{ height: 300, borderRadius: 28 }} />
      <div className="skeleton" style={{ height: 36, width: 240, marginTop: 56 }} />
      <div className="skill-grid" style={{ marginTop: 24 }}>
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="skeleton" style={{ height: 240 }} />
        ))}
      </div>
    </div>
  );
}
