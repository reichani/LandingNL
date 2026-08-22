import { parseCookies, randomToken, sessionCookie, sha256 } from '../security.js';

const SESSION_SECONDS = 60 * 60 * 24 * 30;

export async function createSession(env, userId) {
  const token = randomToken();
  const tokenHash = await sha256(token);
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  await env.DB.prepare(
    'INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?1, ?2, ?3, ?4)',
  ).bind(tokenHash, userId, expiresAt, new Date().toISOString()).run();
  return { token, cookie: sessionCookie(token, SESSION_SECONDS) };
}

export async function getSession(request, env) {
  const token = parseCookies(request).get('landingnl_session');
  if (!token) return null;
  const tokenHash = await sha256(token);
  return env.DB.prepare(
    `SELECT s.user_id AS userId, u.email, u.display_name AS displayName
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ?1 AND s.revoked_at IS NULL AND s.expires_at > ?2`,
  ).bind(tokenHash, Math.floor(Date.now() / 1000)).first();
}

export async function revokeSession(request, env) {
  const token = parseCookies(request).get('landingnl_session');
  if (!token) return;
  await env.DB.prepare('UPDATE sessions SET revoked_at = ?1 WHERE token_hash = ?2')
    .bind(new Date().toISOString(), await sha256(token)).run();
}
