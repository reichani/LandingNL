import Link from "next/link";
import { saveShift } from "./actions";

export default function LogShiftPage() {
  return (
    <main className="shell">
      <Link href="/work" className="text-link">← Work journey</Link>
      <div style={{ height: 20 }} />
      <span className="eyebrow">WORK · PAID HOURS</span>
      <h1 className="title">Log a paid shift.</h1>
      <p className="subtitle">Track actual paid hours month by month. The regulatory threshold stays versioned separately in the Rule Registry.</p>

      <form className="card stack" action={saveShift}>
        <label className="stack">
          <strong>Shift date</strong>
          <input className="input" name="shift_date" type="date" required />
        </label>
        <label className="stack">
          <strong>Paid hours</strong>
          <input className="input" name="paid_hours" type="number" min="0.25" max="24" step="0.25" placeholder="e.g. 8" required />
        </label>
        <label className="stack">
          <strong>Employer</strong>
          <input className="input" name="employer_name" placeholder="Optional" />
        </label>
        <button className="primary" type="submit">Save paid shift →</button>
      </form>

      <p className="muted" style={{ fontSize: 12 }}>Paid hours are user-entered evidence metadata. Keep official payslips and salary evidence for any actual application.</p>
    </main>
  );
}
