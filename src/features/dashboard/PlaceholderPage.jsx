export function PlaceholderPage({ title, description, next }) {
  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Coming next</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </header>
      <section className="panel empty-state">
        <h2>{next}</h2>
        <p>This screen is intentionally parked until the foundation is stable. We will add only the fields and actions needed for the real sales workflow.</p>
      </section>
    </div>
  )
}
