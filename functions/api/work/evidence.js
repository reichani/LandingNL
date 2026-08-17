import { currentMonth, json, readJson } from "../_lib/http.js";
import { requireSession } from "../_lib/session.js";

function validMonth(value) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(String(value || ""));
}

export async function onRequestGet({ request, env }) {
  const session = await requireSession(request, env);
  if (!session) return json({ error: "unauthorized" }, 401);
  const url = new URL(request.url);
  const month = validMonth(url.searchParams.get("month")) ? url.searchParams.get("month") : currentMonth();
  const row = await env.DB.prepare(
    "SELECT month, paid_hours, payslip_ready, salary_evidence_ready FROM work_monthly WHERE user_id = ?1 AND month = ?2",
  ).bind(session.uid, month).first();
  return json({ evidence: row || { month, paid_hours: 0, payslip_ready: 0, salary_evidence_ready: 0 } });
}

export async function onRequestPost({ request, env }) {
  const session = await requireSession(request, env);
  if (!session) return json({ error: "unauthorized" }, 401);
  const body = await readJson(request);
  const month = validMonth(body?.month) ? body.month : currentMonth();
  const paidHours = Number(body?.paidHours ?? 0);
  if (!Number.isFinite(paidHours) || paidHours < 0 || paidHours > 400 || !env.DB) return json({ error: "invalid_request" }, 400);
  const payslipReady = body?.payslipReady ? 1 : 0;
  const salaryEvidenceReady = body?.salaryEvidenceReady ? 1 : 0;

  await env.DB.prepare(
    `INSERT INTO work_monthly (user_id, month, paid_hours, payslip_ready, salary_evidence_ready, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, CURRENT_TIMESTAMP)
     ON CONFLICT(user_id, month) DO UPDATE SET
       paid_hours = excluded.paid_hours,
       payslip_ready = excluded.payslip_ready,
       salary_evidence_ready = excluded.salary_evidence_ready,
       updated_at = CURRENT_TIMESTAMP`,
  ).bind(session.uid, month, paidHours, payslipReady, salaryEvidenceReady).run();
  return json({ ok: true });
}
