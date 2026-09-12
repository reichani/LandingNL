import legacyUi from './legacy-ui.js';
import { verifyGoogleCredential } from './auth/google.js';
import { createSession, getSession, revokeSession } from './auth/session.js';
import { emailLoginConfigured, sendMagicLink } from './email/brevo.js';
import { getUserState, patchUserState, validateOnboardingState } from './repositories/state.js';
import { markOnboardingComplete, upsertUser } from './repositories/users.js';
import {
  assertSameOrigin,
  clearSessionCookie,
  parseCookies,
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

function nextRouteFor(account) {
  return account?.onboardingCompleted || account?.onboardingCompletedAt ? '/dashboard' : '/onboarding';
}

const EMAIL_WINDOW_SECONDS = 900;
const EMAIL_MAX_PER_WINDOW = 3;

// Fail-closed signup gate. Only SIGNUP_MODE=open admits every verified account;
// otherwise an address must be listed in the BETA_ALLOWLIST variable (comma-separated)
// or in the D1 beta_invites table. The check runs before any user row is written,
// so rejected visitors leave no data.
export async function signupAllowed(env, email) {
  if (env.SIGNUP_MODE === 'open') return true;
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized) return false;
  const allowlist = String(env.BETA_ALLOWLIST || '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  if (allowlist.includes(normalized)) return true;
  if (!env.DB) return false;
  const invited = await env.DB.prepare('SELECT 1 AS invited FROM beta_invites WHERE email = ?1')
    .bind(normalized).first('invited');
  return Boolean(invited);
}

async function assertSignupAllowed(env, email) {
  if (!(await signupAllowed(env, email))) {
    throw new HttpError(403, 'LandingNL is currently in closed beta and sign-ups are limited to invited accounts.');
  }
}

async function googleLogin(request, env) {
  assertSameOrigin(request);
  const body = await readJson(request);
  const google = await verifyGoogleCredential(body.credential, env.GOOGLE_CLIENT_ID);
  await assertSignupAllowed(env, google.email);
  const account = await upsertUser(env, { provider: 'google', ...google });
  const session = await createSession(env, account.userId);
  return json({ ok: true, next: nextRouteFor(account) }, 200, { 'Set-Cookie': session.cookie });
}

async function startEmailLogin(request, env) {
  assertSameOrigin(request);
  const { email: rawEmail } = await readJson(request);
  const email = normalizeEmail(rawEmail);
  if (!emailLoginConfigured(env)) throw new HttpError(503, 'Email sign-in is not configured');
  await assertSignupAllowed(env, email);
  const now = Math.floor(Date.now() / 1000);
  const recent = await env.DB.prepare(
    'SELECT COUNT(*) AS count FROM email_login_tokens WHERE email = ?1 AND expires_at > ?2',
  ).bind(email, now).first('count');
  if (Number(recent || 0) >= EMAIL_MAX_PER_WINDOW) {
    throw new HttpError(429, 'Too many sign-in links requested. Please try again in 15 minutes.');
  }
  const token = randomToken();
  await env.DB.prepare(
    'INSERT INTO email_login_tokens (token_hash, email, expires_at, created_at) VALUES (?1, ?2, ?3, ?4)',
  ).bind(await sha256(token), email, now + EMAIL_WINDOW_SECONDS, new Date().toISOString()).run();
  const baseUrl = env.APP_BASE_URL || new URL(request.url).origin;
  await sendMagicLink(env, email, `${baseUrl}/api/auth/email/verify?token=${encodeURIComponent(token)}`);
  return json({ ok: true, message: 'A sign-in link has been sent to your email address.' }, 202);
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
  const account = await upsertUser(env, { provider: 'email', subject: row.email, email: row.email, name: null });
  const session = await createSession(env, account.userId);
  return redirect(request, nextRouteFor(account), { 'Set-Cookie': session.cookie });
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
  if (pathname === '/api/onboarding/complete' && request.method === 'PUT') {
    assertSameOrigin(request);
    const state = validateOnboardingState(await readJson(request));
    if (!state) throw new HttpError(400, 'Invalid profile: you must be 16 or over and every field is required.');
    await patchUserState(env, session.userId, state);
    const completedAt = await markOnboardingComplete(env, session.userId);
    return json({ ok: true, next: '/dashboard', completedAt });
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

const ROBOTS_TXT = `User-agent: *
Allow: /$
Allow: /login
Allow: /privacy
Disallow: /dashboard
Disallow: /onboarding
Disallow: /api/
`;

function staticRoute(url) {
  if (url.pathname === '/robots.txt') {
    return new Response(ROBOTS_TXT, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=86400' },
    });
  }
  if (url.pathname === '/favicon.ico') {
    return new Response(null, { status: 204, headers: { 'Cache-Control': 'public, max-age=86400' } });
  }
  return null;
}

async function handle(request, env) {
  const url = new URL(request.url);
  const staticResponse = staticRoute(url);
  if (staticResponse) return staticResponse;
  if (!env.DB) throw new HttpError(503, 'Database binding is not configured');
  const session = await getSession(request, env);
  const staleCookie = !session && parseCookies(request).has('landingnl_session');
  const response = await route(request, env, url, session);
  // An unknown or revoked cookie (for example the retired phone/SMS prototype cookie) is cleared
  // so the browser stops presenting it and public pages render normally.
  if (staleCookie && !response.headers.has('Set-Cookie')) {
    const headers = new Headers(response.headers);
    headers.append('Set-Cookie', clearSessionCookie());
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  }
  return response;
}

async function route(request, env, url, session) {
  if (url.pathname.startsWith('/api/')) return apiRoute(request, env, session);
  if (url.pathname === '/' && session) return redirect(request, nextRouteFor(session));
  if ((url.pathname === '/dashboard' || url.pathname === '/onboarding') && !session) {
    return redirect(request, '/login');
  }
  if (url.pathname === '/login' && session) return redirect(request, nextRouteFor(session));
  if (url.pathname === '/dashboard' && session && !session.onboardingCompletedAt) {
    return redirect(request, '/onboarding');
  }
  // ?edit=1 re-opens onboarding so a student can correct a wrong age, city or school.
  if (url.pathname === '/onboarding' && session?.onboardingCompletedAt && !url.searchParams.has('edit')) {
    return redirect(request, '/dashboard');
  }

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
