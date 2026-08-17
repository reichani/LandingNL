import { json, oneOf, readJson } from "./_lib/http.js";
import { requireSession } from "./_lib/session.js";

const allowedKeys = ["municipality", "bsn", "digid", "cv", "contract", "duo"];

export async function onRequestPost({ request, env }) {
  const session = await requireSession(request, env);
  if (!session) return json({ error: "unauthorized" }, 401);
  const body = await readJson(request);
  const key = oneOf(body?.key, allowedKeys);
  const status = oneOf(body?.status, ["todo", "completed"]);
  if (!key || !status || !env.DB) return json({ error: "invalid_request" }, 400);

  await env.DB.prepare(
    `INSERT INTO milestones (user_id, milestone_key, status, updated_at)
     VALUES (?1, ?2, ?3, CURRENT_TIMESTAMP)
     ON CONFLICT(user_id, milestone_key) DO UPDATE SET status = excluded.status, updated_at = CURRENT_TIMESTAMP`,
  ).bind(session.uid, key, status).run();

  return json({ ok: true, key, status });
}
