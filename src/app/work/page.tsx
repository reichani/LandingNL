import Link from "next/link";
import { summarizeWorkMonth } from "@/domain/work";

export default function WorkPage() {
  const status = summarizeWorkMonth(26);
  const message = status.status === "target-reached"
    ? "Target reached for this month. Keep your payslip and salary evidence ready."
    : status.status === "review-zone"
      ? `${status.remainingHours} more paid hours to reach the current strong threshold.`
      : `${status.remainingHours} more paid hours to reach the current threshold.`;

  const evidenceReady = 1;
  const evidenceTotal = 4;

  return (
    <main className="shell">
      <span className="eyebrow">WORK JOURNEY</span>
      <h1 className="title">Build income. Keep evidence ready.</h1>
      <p className="subtitle">CV, applications, contract, monthly paid hours and DUO evidence stay in one flow.</p>

      <section className="focus stack">
        <div className="row">
          <span className="pill">DUO WORK STATUS</span>
          <strong>{status.status === "target-reached" ? "Safe" : status.status === "review-zone" ? "Attention" : "At risk"}</strong>
        </div>
        <h2 style={{ fontSize: 34, margin: 0 }}>{status.paidHours} / {status.targetHours} paid hours</h2>
        <p style={{ margin: 0 }}>{message}</p>
        <button className="primary">Log a shift →</button>
        <p className="muted" style={{ margin: 0, fontSize: 12 }}>Guidance only. DUO makes the eligibility decision.</p>
      </section>

      <div style={{ height: 16 }} />
      <section className="card stack">
        <div className="row"><strong>Student CV</strong><Link className="pill" href="/work/cv">Build CV</Link></div>
        <div className="row"><span>Applications</span><strong>0</strong></div>
        <div className="row"><span>Employment contract</span><Link className="pill" href="/work/contract">Check contract</Link></div>
        <div className="row"><span>Employer pack</span><Link className="pill" href="/work/employer-pack">Open & share</Link></div>
      </section>

      <div style={{ height: 16 }} />
      <section className="card stack">
        <div className="row"><strong>Monthly evidence</strong><span className="pill">{evidenceReady}/{evidenceTotal} ready</span></div>
        <div className="row"><span>✓ Employment contract</span><span className="muted">Ready</span></div>
        <div className="row"><span>○ Paid-hours record</span><span className="muted">Waiting</span></div>
        <div className="row"><span>○ Payslip</span><span className="muted">Waiting</span></div>
        <div className="row"><span>○ Salary bank evidence</span><span className="muted">Waiting</span></div>
      </section>
    </main>
  );
}
