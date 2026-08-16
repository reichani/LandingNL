const contractFields = [
  ["Employee legal name", "Required"],
  ["Employer legal name", "Required"],
  ["Employment start date", "Critical"],
  ["Contract type", "Required"],
  ["Weekly / monthly working hours", "Strong evidence"],
  ["Gross hourly wage", "Required"],
  ["Role / title", "Recommended"],
  ["Work location", "Recommended"],
  ["Pay frequency", "Recommended"],
  ["Both signatures", "Required"],
];

export default function ContractCheckPage() {
  return (
    <main className="shell">
      <span className="eyebrow">WORK · CONTRACT CHECK</span>
      <h1 className="title">Check before you sign.</h1>
      <p className="subtitle">We check for evidence quality and journey blockers, not legal validity.</p>

      <section className="focus stack">
        <span className="pill">CONTRACT READINESS</span>
        <h2 style={{ margin: 0 }}>0 / {contractFields.length} checked</h2>
        <p style={{ margin: 0 }}>Add your proposed contract details or document later. LandingNL will flag missing evidence fields and important dates.</p>
        <button className="primary">Add contract details →</button>
      </section>

      <div style={{ height: 16 }} />
      <section className="card stack">
        {contractFields.map(([label, importance]) => (
          <div className="row" key={label}>
            <span>○ {label}</span>
            <span className="muted">{importance}</span>
          </div>
        ))}
      </section>

      <div style={{ height: 16 }} />
      <section className="card stack">
        <strong>Start-date alert</strong>
        <p style={{ margin: 0 }}>LandingNL will compare the employment start date with the current DUO rule and flag any financing timing impact before the student relies on it.</p>
        <p className="muted" style={{ margin: 0, fontSize: 12 }}>The underlying rule is versioned in Admin → Rule Registry.</p>
      </section>
    </main>
  );
}
