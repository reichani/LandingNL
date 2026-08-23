import Link from "next/link";
import { PrimaryNav } from "@/components/PrimaryNav";
import { ruleRegistry } from "@/domain/rules";
import { summarizeWorkMonth } from "@/domain/work";
import { createClient } from "@/lib/supabase/server";

const EVIDENCE_TYPES = ["contract", "paid_hours", "payslip", "salary_bank"] as const;
const DUO_RULE_KEYS = [
  "duo.eu_worker.monthly_hours",
  "duo.eu_worker.review_average_hours",
  "duo.eu_worker.review_months",
  "duo.eu_worker.income_threshold_21_plus_2026",
  "duo.eu_worker.income_threshold_under_21_2026",
] as const;

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
  const bounds = monthBounds();
  let signedIn = false;
  let paidHours = 0;
  let targetHours = ruleRegistry.duoEuWorkerMonthlyHours.value;
  let reviewHours = ruleRegistry.duoEuWorkerReviewAverageHours.value;
  let reviewMonths = ruleRegistry.duoEuWorkerReviewMonths.value;
  let income21Plus = ruleRegistry.duoEuWorkerIncomeThreshold21Plus.value;
  let incomeUnder21 = ruleRegistry.duoEuWorkerIncomeThresholdUnder21.value;
  let applicationCount = 0;
  const evidence = new Set<string>();

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    signedIn = Boolean(user);

    if (user) {
      const [{ data: shifts }, { data: evidenceRows }, { data: ruleRows }, { count }] = await Promise.all([
        supabase.from("work_shifts").select("paid_hours").eq("user_id", user.id).gte("shift_date", bounds.start).lt("shift_date", bounds.end),
        supabase.from("work_evidence").select("evidence_type,status").eq("user_id", user.id).eq("month", bounds.month),
        supabase.from("rule_registry").select("rule_key,value").in("rule_key", [...DUO_RULE_KEYS]).eq("status", "active").lte("effective_from", bounds.month).or(`effective_to.is.null,effective_to.gte.${bounds.month}`).order("version", { ascending: false }),
        supabase.from("job_applications").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);

      paidHours = (shifts ?? []).reduce((sum, row) => sum + Number(row.paid_hours ?? 0), 0);
      (evidenceRows ?? []).filter((row) => ["ready","verified"].includes(row.status)).forEach((row) => evidence.add(row.evidence_type));
      applicationCount = count ?? 0;

      const ruleValues = new Map<string, number>();
      for (const row of ruleRows ?? []) {
        if (ruleValues.has(row.rule_key)) continue;
        const configured = row.value as { value?: number } | undefined;
        if (typeof configured?.value === "number") ruleValues.set(row.rule_key, configured.value);
      }
      targetHours = ruleValues.get("duo.eu_worker.monthly_hours") ?? targetHours;
      reviewHours = ruleValues.get("duo.eu_worker.review_average_hours") ?? reviewHours;
      reviewMonths = ruleValues.get("duo.eu_worker.review_months") ?? reviewMonths;
      income21Plus = ruleValues.get("duo.eu_worker.income_threshold_21_plus_2026") ?? income21Plus;
      incomeUnder21 = ruleValues.get("duo.eu_worker.income_threshold_under_21_2026") ?? incomeUnder21;
    }
  } catch {
    // Work remains browsable in preview mode with the last reviewed in-code rule snapshot.
  }

  if (paidHours > 0) evidence.add("paid_hours");
  const status = summarizeWorkMonth(paidHours, targetHours, reviewHours);
  const message = status.status === "standard-hours-indicator"
    ? `You reached the ${targetHours}-hour monthly work indicator. This is not an eligibility decision; DUO also considers the full conditions and may use income as an alternative worker indicator.`
    : status.status === "review-zone"
      ? `${paidHours} hours is within DUO’s ${reviewHours}–${targetHours - 1} hour review zone. Where work continues for ${reviewMonths} months or more, DUO may assess the average hours worked.`
      : `This month is below the ${reviewHours}-hour review threshold. Other migrant-worker evidence and the income route may still matter, so do not treat this number alone as an eligibility result.`;
  const evidenceReady = EVIDENCE_TYPES.filter((type) => evidence.has(type)).length;

  return (
    <main className="shell">
      <span className="eyebrow">WORK JOURNEY</span>
      <h1 className="title">Build income. Keep evidence ready.</h1>
      <p className="subtitle">CV, applications, contract, monthly paid hours and DUO evidence stay in one flow.</p>

      {!signedIn ? (
        <section className="card stack">
          <div className="row"><strong>Preview mode</strong><span className="pill">NO ACCOUNT NEEDED</span></div>
          <p className="muted" style={{ margin: 0 }}>Explore the full work journey first. Sign in when you want to save applications, shifts and evidence.</p>
          <Link className="secondary" href="/login">Sign in with Google →</Link>
        </section>
      ) : null}

      <div style={{ height: 16 }} />
      <section className="focus stack">
        <div className="row"><span className="pill">DUO EVIDENCE VIEW</span><strong>{signedIn ? (status.status === "standard-hours-indicator" ? "32h indicator" : status.status === "review-zone" ? "Review zone" : "Build evidence") : "Preview"}</strong></div>
        <h2 style={{ fontSize: 34, margin: 0 }}>{paidHours} paid hours this month</h2>
        <p style={{ margin: 0 }}>{message}</p>
        <div className="card stack" style={{ marginTop: 4 }}>
          <strong>2026 income indicator is separate</strong>
          <span>DUO also states that monthly income of at least €{income21Plus.toLocaleString("en-NL")} can be sufficient for the worker condition; for students under 21 the published 2026 amount is €{incomeUnder21.toLocaleString("en-NL")}.</span>
          <span className="muted" style={{ fontSize: 12 }}>LandingNL does not currently calculate this income test and does not determine student-finance eligibility.</span>
        </div>
        <Link className="primary" href={signedIn ? "/work/log-shift" : "/login"}>{signedIn ? "Log a shift →" : "Sign in to track →"}</Link>
        <p className="muted" style={{ margin: 0, fontSize: 12 }}>Guidance only. Rules are versioned and reviewed; DUO makes the eligibility decision.</p>
      </section>

      <div style={{ height: 16 }} />
      <section className="card stack">
        <div className="row"><strong>Student CV</strong><Link className="pill" href="/work/cv">Build CV</Link></div>
        <div className="row"><span>Applications</span><Link className="pill" href="/work/applications">{applicationCount} tracked</Link></div>
        <div className="row"><span>Employment contract</span><Link className="pill" href="/work/contract">Check contract</Link></div>
        <div className="row"><span>Employer pack</span><Link className="pill" href="/work/employer-pack">Open & share</Link></div>
      </section>

      <div style={{ height: 16 }} />
      <section className="card stack">
        <div className="row"><strong>Monthly evidence</strong><span className="pill">{evidenceReady}/{EVIDENCE_TYPES.length} ready</span></div>
        <div className="row"><span>{evidence.has("contract") ? "✓" : "○"} Employment contract</span><span className="muted">{evidence.has("contract") ? "Ready" : "Waiting"}</span></div>
        <div className="row"><span>{evidence.has("paid_hours") ? "✓" : "○"} Paid-hours record</span><span className="muted">{evidence.has("paid_hours") ? "Ready" : "Waiting"}</span></div>
        <div className="row"><span>{evidence.has("payslip") ? "✓" : "○"} Payslip</span><span className="muted">{evidence.has("payslip") ? "Ready" : "Waiting"}</span></div>
        <div className="row"><span>{evidence.has("salary_bank") ? "✓" : "○"} Salary bank evidence</span><span className="muted">{evidence.has("salary_bank") ? "Ready" : "Waiting"}</span></div>
        <Link className="secondary" href="/work/evidence">Manage monthly evidence →</Link>
      </section>

      <PrimaryNav active="Work" />
    </main>
  );
}
