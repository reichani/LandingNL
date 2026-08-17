import { cleanString, json, oneOf, readJson } from "./_lib/http.js";
import { requireSession } from "./_lib/session.js";

const studentTypes = ["bachelor", "master", "exchange", "other"];
const citizenshipGroups = ["eu_eea_swiss", "non_eu"];
const housingStatuses = ["secured", "searching"];

export async function onRequestPost({ request, env }) {
  const session = await requireSession(request, env);
  if (!session) return json({ error: "unauthorized" }, 401);
  const body = await readJson(request);
  if (!body || !env.DB) return json({ error: "invalid_request" }, 400);

  const city = cleanString(body.city, 80);
  const university = cleanString(body.university, 120);
  const studentType = oneOf(body.studentType, studentTypes);
  const citizenshipGroup = oneOf(body.citizenshipGroup, citizenshipGroups);
  const housingStatus = oneOf(body.housingStatus, housingStatuses);
  const arrivalDate = /^\d{4}-\d{2}-\d{2}$/.test(String(body.arrivalDate || "")) ? String(body.arrivalDate) : "";

  if (!city || !university || !studentType || !citizenshipGroup || !housingStatus || !arrivalDate) {
    return json({ error: "missing_fields" }, 400);
  }

  await env.DB.prepare(
    `INSERT INTO profiles (user_id, city, university, student_type, citizenship_group, arrival_date, housing_status, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, CURRENT_TIMESTAMP)
     ON CONFLICT(user_id) DO UPDATE SET
       city = excluded.city,
       university = excluded.university,
       student_type = excluded.student_type,
       citizenship_group = excluded.citizenship_group,
       arrival_date = excluded.arrival_date,
       housing_status = excluded.housing_status,
       updated_at = CURRENT_TIMESTAMP`,
  ).bind(session.uid, city, university, studentType, citizenshipGroup, arrivalDate, housingStatus).run();

  return json({ ok: true });
}
