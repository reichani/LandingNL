import { currentMonth, json } from "./_lib/http.js";
import { requireSession } from "./_lib/session.js";

export async function onRequestGet({ request, env }) {
  const session = await requireSession(request, env);
  if (!session) return json({ error: "unauthorized" }, 401);
  if (!env.DB) return json({ error: "unavailable" }, 503);

  const user = await env.DB.prepare(
    "SELECT id, email, first_name, full_name, avatar_url FROM users WHERE id = ?1",
  ).bind(session.uid).first();
  if (!user) return json({ error: "unauthorized" }, 401);

  const profile = await env.DB.prepare(
    `SELECT city, university, student_type, citizenship_group, arrival_date, housing_status
     FROM profiles WHERE user_id = ?1`,
  ).bind(session.uid).first();

  const milestones = await env.DB.prepare(
    "SELECT milestone_key, status FROM milestones WHERE user_id = ?1",
  ).bind(session.uid).all();

  const budget = await env.DB.prepare(
    "SELECT item_key, amount_cents FROM budget_items WHERE user_id = ?1",
  ).bind(session.uid).all();

  const applicationCount = await env.DB.prepare(
    "SELECT COUNT(*) AS count FROM job_applications WHERE user_id = ?1",
  ).bind(session.uid).first();

  const work = await env.DB.prepare(
    "SELECT paid_hours, payslip_ready, salary_evidence_ready FROM work_monthly WHERE user_id = ?1 AND month = ?2",
  ).bind(session.uid, currentMonth()).first();

  return json({
    user,
    profile: profile || null,
    milestones: milestones.results || [],
    budget: budget.results || [],
    work: work || { paid_hours: 0, payslip_ready: 0, salary_evidence_ready: 0 },
    applicationCount: Number(applicationCount?.count || 0),
  });
}
