import legacyUi from './legacy-ui.js';
import { verifyGoogleCredential } from './auth/google.js';
import { createSession, getSession, revokeSession } from './auth/session.js';
import { sendMagicLink } from './email/brevo.js';
import { getUserState, patchUserState } from './repositories/state.js';
import { upsertUser } from './repositories/users.js';
import {
  assertSameOrigin,
  clearSessionCookie,
  HttpError,
  randomToken,
  readJson,
  securityHeaders,
  sha256,
} from './security.js';

function json(data, status = 200, extraHeaders = {}) {
  return Response.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store', ...extraHeaders },
  });
}

function redirect(request, path, headers = {}) {
  return new Response(null, {
    status: 303,
    headers: { Location: new URL(path, request.url).toString(), 'Cache-Control': 'no-store', ...headers },
  });
}

function normalizeEmail(value) {
  if (typeof value !== 'string') throw new HttpError(400, 'Valid email required');
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Valid email required');
  return email;
}

async function googleLogin(request, env) {
  assertSameOrigin(request);
  const body = await readJson(request);
  const google = await verifyGoogleCredential(body.credential, env.GOOGLE_CLIENT_ID);
  const userId = await upsertUser(env, { provider: 'google', ...google });
  const session = await createSession(env, userId);
  return json({ ok: true, next: '/onboarding' }, 200, { 'Set-Cookie': session.cookie });
}

async function startEmailLogin(request, env) {
  assertSameOrigin(request);
  const { email: rawEmail } = await readJson(request);
  const email = normalizeEmail(rawEmail);
  const token = randomToken();
  await env.DB.prepare(
    'INSERT INTO email_login_tokens (token_hash, email, expires_at, created_at) VALUES (?1, ?2, ?3, ?4)',
  ).bind(await sha256(token), email, Math.floor(Date.now() / 1000) + 900, new Date().toISOString()).run();
  const baseUrl = env.APP_BASE_URL || new URL(request.url).origin;
  await sendMagicLink(env, email, `${baseUrl}/api/auth/email/verify?token=${encodeURIComponent(token)}`);
  return json({ ok: true, message: 'Giriş bağlantısı e-posta adresine gönderildi.' }, 202);
}

async function verifyEmailLogin(request, env) {
  const token = new URL(request.url).searchParams.get('token');
  if (!token) throw new HttpError(400, 'Missing token');
  const tokenHash = await sha256(token);
  const row = await env.DB.prepare(
    `UPDATE email_login_tokens SET consumed_at = ?1
      WHERE token_hash = ?2 AND consumed_at IS NULL AND expires_at > ?3
      RETURNING email`,
  ).bind(new Date().toISOString(), tokenHash, Math.floor(Date.now() / 1000)).first();
  if (!row) throw new HttpError(401, 'This sign-in link is invalid or expired');
  const userId = await upsertUser(env, { provider: 'email', subject: row.email, email: row.email, name: null });
  const session = await createSession(env, userId);
  return redirect(request, '/onboarding', { 'Set-Cookie': session.cookie });
}

async function apiRoute(request, env, session) {
  const { pathname } = new URL(request.url);
  if (pathname === '/api/auth/google' && request.method === 'POST') return googleLogin(request, env);
  if (pathname === '/api/auth/email/start' && request.method === 'POST') return startEmailLogin(request, env);
  if (pathname === '/api/auth/email/verify' && request.method === 'GET') return verifyEmailLogin(request, env);
  if (pathname === '/api/auth/logout' && request.method === 'POST') {
    assertSameOrigin(request);
    await revokeSession(request, env);
    return json({ ok: true }, 200, { 'Set-Cookie': clearSessionCookie() });
  }
  if (!session) throw new HttpError(401, 'Authentication required');
  if (pathname === '/api/session' && request.method === 'GET') return json({ user: session });
  if (pathname === '/api/state' && request.method === 'GET') return json({ state: await getUserState(env, session.userId) });
  if (pathname === '/api/state' && request.method === 'PATCH') {
    assertSameOrigin(request);
    const body = await readJson(request);
    return json({ state: await patchUserState(env, session.userId, body) });
  }
  if (pathname === '/api/rules' && request.method === 'GET') {
    const date = new Date().toISOString().slice(0, 10);
    const { results } = await env.DB.prepare(
      `SELECT rule_key, version, value_json, source_url, valid_from, valid_until, last_reviewed
         FROM regulatory_rules
        WHERE published = 1 AND locale = ?1 AND valid_from <= ?2
          AND (valid_until IS NULL OR valid_until >= ?2)
        ORDER BY rule_key, version DESC`,
    ).bind('tr-NL', date).all();
    const rules = {};
    for (const row of results) {
      if (rules[row.rule_key]) continue;
      rules[row.rule_key] = { ...row, value: JSON.parse(row.value_json) };
      delete rules[row.rule_key].value_json;
    }
    return json({ rules });
  }
  throw new HttpError(404, 'Not found');
}

async function handle(request, env) {
  if (!env.DB) throw new HttpError(503, 'Database binding is not configured');
  const url = new URL(request.url);
  const session = await getSession(request, env);

  if (url.pathname.startsWith('/api/')) return apiRoute(request, env, session);
  if (url.pathname === '/' && session) return redirect(request, '/dashboard');
  if ((url.pathname === '/dashboard' || url.pathname === '/onboarding') && !session) {
    return redirect(request, '/login');
  }
  if (url.pathname === '/login' && session) return redirect(request, '/dashboard');

  return legacyUi.fetch(request, env);
}

export default {
  async fetch(request, env) {
    try {
      return securityHeaders(await handle(request, env));
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 500;
      const message = error instanceof HttpError ? error.message : 'Internal server error';
      console.error(JSON.stringify({ message: 'request_failed', status, path: new URL(request.url).pathname, error: String(error) }));
      return securityHeaders(json({ error: message }, status));
    }
  },
};
