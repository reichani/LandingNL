import { cleanString, json, oneOf, readJson } from "../_lib/http.js";
import { requireSession } from "../_lib/session.js";

const stages = ["saved", "applied", "interview", "offer", "closed"];

export async function onRequestGet({ request, env }) {
  const session = await requireSession(request, env);
  if (!session) return json({ error: "unauthorized" }, 401);
  const result = await env.DB.prepare(
    `SELECT id, employer, role, stage, created_at, updated_at
     FROM job_applications WHERE user_id = ?1 ORDER BY updated_at DESC LIMIT 50`,
  ).bind(session.uid).all();
  return json({ applications: result.results || [] });
}

export async function onRequestPost({ request, env }) {
  const session = await requireSession(request, env);
  if (!session) return json({ error: "unauthorized" }, 401);
  const body = await readJson(request);
  const employer = cleanString(body?.employer, 120);
  const role = cleanString(body?.role, 120);
  const stage = oneOf(body?.stage, stages, "applied");
  if (!employer || !role || !env.DB) return json({ error: "missing_fields" }, 400);

  await env.DB.prepare(
    `INSERT INTO job_applications (user_id, employer, role, stage, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
  ).bind(session.uid, employer, role, stage).run();
  return json({ ok: true }, 201);
}
