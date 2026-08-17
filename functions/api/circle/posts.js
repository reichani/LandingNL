import { cleanString, json, oneOf, readJson } from "../_lib/http.js";
import { requireSession } from "../_lib/session.js";

const kinds = ["ask", "offer", "pass"];
const exchangeTypes = ["free", "favour", "borrow", "swap", "paid"];

function containsDirectContact(value) {
  const text = String(value || "");
  const email = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
  const phone = /(?:\+?\d[\s().-]*){8,}/;
  return email.test(text) || phone.test(text);
}

export async function onRequestGet({ request, env }) {
  const session = await requireSession(request, env);
  if (!session) return json({ error: "unauthorized" }, 401);
  const result = await env.DB.prepare(
    `SELECT cp.id, cp.kind, cp.exchange_type, cp.title, cp.body, cp.area, cp.created_at,
            u.first_name AS author_name, p.university AS author_university
     FROM circle_posts cp
     JOIN users u ON u.id = cp.user_id
     LEFT JOIN profiles p ON p.user_id = cp.user_id
     WHERE cp.status = 'open' AND (cp.expires_at IS NULL OR cp.expires_at > CURRENT_TIMESTAMP)
     ORDER BY cp.created_at DESC LIMIT 50`,
  ).all();
  return json({ posts: result.results || [] });
}

export async function onRequestPost({ request, env }) {
  const session = await requireSession(request, env);
  if (!session) return json({ error: "unauthorized" }, 401);
  const body = await readJson(request);
  const kind = oneOf(body?.kind, kinds);
  const exchangeType = oneOf(body?.exchangeType, exchangeTypes);
  const title = cleanString(body?.title, 100);
  const description = cleanString(body?.body, 500);
  const area = cleanString(body?.area, 80);
  if (!kind || !exchangeType || !title || !description || !env.DB) return json({ error: "missing_fields" }, 400);
  if (containsDirectContact(`${title} ${description}`)) return json({ error: "contact_details_not_allowed" }, 400);

  await env.DB.prepare(
    `INSERT INTO circle_posts (user_id, kind, exchange_type, title, body, area, status, created_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'open', CURRENT_TIMESTAMP)`,
  ).bind(session.uid, kind, exchangeType, title, description, area || null).run();
  return json({ ok: true }, 201);
}
