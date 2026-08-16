import { ruleRegistry } from "@/domain/rules";

const findings = [
  { title: "DUO · EU worker monthly-hours rule", risk: "CRITICAL", impact: "Work Tracker · DUO guidance · reminders" },
  { title: "Amsterdam · registration documents", risk: "HIGH", impact: "Housing · Wallet · municipality task" },
  { title: "Health insurance after paid work", risk: "HIGH", impact: "Work event · insurance task · budget" },
] as const;

export default function AdminRulesPage() {
  return (
    <main className="shell" style={{ maxWidth: 980 }}>
      <span className="eyebrow">ADMIN · REGULATORY OPERATIONS</span>
      <h1 className="title">Rules change. Journeys stay trustworthy.</h1>
      <p className="subtitle">Agents propose changes. High-impact rules require human verification, versioning and impact review before publication.</p>

      <section className="card stack">
        <div className="row"><strong>Current Rule Registry</strong><span className="pill">VERSIONED</span></div>
        <div className="row"><span>DUO EU worker monthly hours</span><strong>{ruleRegistry.duoEuWorkerMonthlyHours.value} h</strong></div>
        <div className="row"><span>Effective from</span><span className="muted">{ruleRegistry.duoEuWorkerMonthlyHours.effectiveFrom}</span></div>
        <div className="row"><span>Risk</span><span className="pill">{ruleRegistry.duoEuWorkerMonthlyHours.risk}</span></div>
      </section>

      <div style={{ height: 18 }} />
      <section className="card stack">
        <div className="row"><strong>Agent findings</strong><span className="pill">3 NEED REVIEW</span></div>
        {findings.map((finding) => (
          <article className="stack" key={finding.title} style={{ borderTop: "1px solid var(--line)", paddingTop: 14 }}>
            <div className="row"><strong>{finding.title}</strong><span className="pill">{finding.risk}</span></div>
            <span className="muted">Affects: {finding.impact}</span>
            <div className="row">
              <button className="secondary">Review source</button>
              <button className="primary">Impact preview</button>
            </div>
          </article>
        ))}
      </section>

      <div style={{ height: 18 }} />
      <section className="card stack">
        <span className="eyebrow">GOVERNANCE RULE</span>
        <strong>No agent writes critical rules directly to production.</strong>
        <span className="muted">Approve → new version → effective date → regression checks → affected-user recalculation → publish → audit log.</span>
      </section>
    </main>
  );
}
