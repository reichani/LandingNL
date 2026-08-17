import { json, readJson } from "./_lib/http.js";
import { requireSession } from "./_lib/session.js";

const allowedKeys = ["rent", "food", "transport", "insurance", "other"];

export async function onRequestGet({ request, env }) {
  const session = await requireSession(request, env);
  if (!session) return json({ error: "unauthorized" }, 401);
  const result = await env.DB.prepare(
    "SELECT item_key, amount_cents FROM budget_items WHERE user_id = ?1",
  ).bind(session.uid).all();
  return json({ items: result.results || [] });
}

export async function onRequestPost({ request, env }) {
  const session = await requireSession(request, env);
  if (!session) return json({ error: "unauthorized" }, 401);
  const body = await readJson(request);
  if (!body?.items || typeof body.items !== "object" || !env.DB) return json({ error: "invalid_request" }, 400);

  const statements = [];
  for (const key of allowedKeys) {
    const amount = Number(body.items[key] ?? 0);
    if (!Number.isFinite(amount) || amount < 0 || amount > 100000) return json({ error: "invalid_amount" }, 400);
    const cents = Math.round(amount * 100);
    statements.push(
      env.DB.prepare(
        `INSERT INTO budget_items (user_id, item_key, amount_cents, updated_at)
         VALUES (?1, ?2, ?3, CURRENT_TIMESTAMP)
         ON CONFLICT(user_id, item_key) DO UPDATE SET amount_cents = excluded.amount_cents, updated_at = CURRENT_TIMESTAMP`,
      ).bind(session.uid, key, cents),
    );
  }
  await env.DB.batch(statements);
  return json({ ok: true });
}
