const ALLOWED_KEYS = new Set([
  'age', 'status', 'city', 'program', 'housing', 'step', 'bsn_date', 'is_working', 'user_swaps',
]);

export async function getUserState(env, userId) {
  const payload = await env.DB.prepare('SELECT payload_json FROM user_state WHERE user_id = ?1')
    .bind(userId).first('payload_json');
  if (!payload) return {};
  try { return JSON.parse(payload); } catch { return {}; }
}

export async function patchUserState(env, userId, patch) {
  const current = await getUserState(env, userId);
  for (const [key, value] of Object.entries(patch)) {
    if (!ALLOWED_KEYS.has(key)) continue;
    if (typeof value !== 'string' || value.length > 4000) continue;
    current[key] = value;
  }
  const payload = JSON.stringify(current);
  await env.DB.prepare(
    `INSERT INTO user_state (user_id, payload_json, updated_at) VALUES (?1, ?2, ?3)
     ON CONFLICT(user_id) DO UPDATE SET payload_json = excluded.payload_json, updated_at = excluded.updated_at`,
  ).bind(userId, payload, new Date().toISOString()).run();
  return current;
}
