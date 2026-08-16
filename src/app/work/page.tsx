import Link from "next/link";
import { getWorkHourStatus } from "@/domain/work";

export default function WorkPage() {
  const status = getWorkHourStatus(26);

  return (
    <main className="shell">
      <span className="eyebrow">WORK JOURNEY</span>
      <h1 className="title">Build income. Keep evidence ready.</h1>
      <p className="subtitle">CV, applications, contract and paid hours stay connected to your landing plan.</p>

      <section className="focus stack">
        <span className="pill">THIS MONTH</span>
        <h2 style={{ fontSize: 34, margin: 0 }}>{status.currentHours} / {status.targetHours} paid hours</h2>
        <p style={{ margin: 0 }}>{status.message}</p>
        <button className="primary">Log a shift →</button>
      </section>

      <div style={{ height: 16 }} />
      <section className="card stack">
        <div className="row"><strong>Student CV</strong><Link className="pill" href="/work/cv">Build CV</Link></div>
        <div className="row"><span>Applications</span><strong>0</strong></div>
        <div className="row"><span>Contract</span><span className="muted">Not added yet</span></div>
        <div className="row"><span>Payslip</span><span className="muted">Waiting</span></div>
      </section>
    </main>
  );
}
