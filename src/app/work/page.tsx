import Link from "next/link";
import { summarizeWorkMonth } from "@/domain/work";
import { createClient } from "@/lib/supabase/server";

const EVIDENCE_TYPES = ["contract", "paid_hours", "payslip", "salary_bank"] as const;

function monthBounds(now = new Date()) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return {
    month: start.toISOString().slice(0, 10),
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export default async function WorkPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const bounds = monthBounds();

  let paidHours = 0;
  let targetHours = 32;
  const evidence = new Set<string>();

  if (user) {
    const [{ data: shifts }, { data: evidenceRows }, { data: ruleRows }] = await Promise.all([
      supabase
        .from("work_shifts")
        .select("paid_hours")
        .gte("shift_date", bounds.start)
        .lt("shift_date", bounds.end),
      supabase
        .from("work_evidence")
        .select("evidence_type")
        .eq("month", bounds.month),
      supabase
        .from("rule_registry")
        .select("value")
        .eq("rule_key", "duo.eu_worker.monthly_hours")
        .eq("status", "active")
        .lte("effective_from", bounds.month)
        .or(`effective_to.is.null,effective_to.gte.${bounds.month}`)
        .order("version", { ascending: false })
        .limit(1),
    ]);

    paidHours = (shifts ?? []).reduce((sum, row) => sum + Number(row.paid_hours ?? 0), 0);
    (evidenceRows ?? []).forEach((row) => evidence.add(row.evidence_type));

    const configured = ruleRows?.[0]?.value as { value?: number } | undefined;
    if (typeof configured?.value === "number") targetHours = configured.value;
  }

  if (paidHours > 0) evidence.add("paid_hours");

  const status = summarizeWorkMonth(paidHours, targetHours);
  const message = status.status === "target-reached"
    ? "Target reached for this month. Keep your payslip and salary evidence ready."
    : status.status === "review-zone"
      ? `${status.remainingHours} more paid hours to reach the current strong threshold.`
      : `${status.remainingHours} more paid hours to reach the current threshold.`;

  const evidenceReady = EVIDENCE_TYPES.filter((type) => evidence.has(type)).length;
  const evidenceTotal = EVIDENCE_TYPES.length;

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
        <Link className="primary" href="/work/log-shift">Log a shift →</Link>
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
        <div className="row"><span>{evidence.has("contract") ? "✓" : "○"} Employment contract</span><span className="muted">{evidence.has("contract") ? "Ready" : "Waiting"}</span></div>
        <div className="row"><span>{evidence.has("paid_hours") ? "✓" : "○"} Paid-hours record</span><span className="muted">{evidence.has("paid_hours") ? "Ready" : "Waiting"}</span></div>
        <div className="row"><span>{evidence.has("payslip") ? "✓" : "○"} Payslip</span><span className="muted">{evidence.has("payslip") ? "Ready" : "Waiting"}</span></div>
        <div className="row"><span>{evidence.has("salary_bank") ? "✓" : "○"} Salary bank evidence</span><span className="muted">{evidence.has("salary_bank") ? "Ready" : "Waiting"}</span></div>
      </section>
    </main>
  );
}
