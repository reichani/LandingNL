import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

import worker from '../src/index.js';
import legacyUi from '../src/legacy-ui.js';

function createDb(overrides = {}) {
  return {
    prepare(sql) {
      let values = [];
      const statement = {
        bind(...args) { values = args; return statement; },
        async first(column) {
          if (overrides.first) return overrides.first(sql, column, values);
          return null;
        },
        async all() { return { results: [] }; },
        async run() {
          if (overrides.run) return overrides.run(sql, values);
          return { success: true };
        },
      };
      return statement;
    },
  };
}

const env = { DB: createDb(), GOOGLE_CLIENT_ID: 'test-client-id.apps.googleusercontent.com' };

const PAGE_HASHES = new Map([
  ['/', 'a17866c0e38a2bd841d4bd2c5f4fb089b4e59319830aa28a89f4286dbe32a171'],
  ['/login', '1b46e366a392579600f9c0503b79d1990875ac97e9fb549e665e1ac73299a522'],
  ['/onboarding', '523ea18e03087c9388c50598f11a7dfb79b28df46b3abc95c8aa4c8d98b6513c'],
  ['/dashboard', 'b1b2aed392124794736001ecfc78bd9acc386603cd60047d7999583ee5720914'],
]);

test('rendered pages remain byte-for-byte identical to their approved baselines', async () => {
  for (const [path, expectedHash] of PAGE_HASHES) {
    const response = await legacyUi.fetch(new Request(`https://example.test${path}`), env);
    const body = await response.text();
    const hash = createHash('sha256').update(body).digest('hex');
    assert.equal(response.status, 200, path);
    assert.equal(hash, expectedHash, path);
  }
});

test('public landing and login routes remain available', async () => {
  for (const path of ['/', '/login']) {
    const response = await worker.fetch(new Request(`https://example.test${path}`), env);
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get('content-type') ?? '', /text\/html/);
  }
});

test('welcome page has one resilient journey entry and no header login action', async () => {
  const response = await legacyUi.fetch(new Request('https://example.test/'), env);
  const html = await response.text();
  assert.match(html, /<a class="cta" id="journey-start" href="\/login">Yolculuğu Başlat ➔<\/a>/);
  assert.doesNotMatch(html, /btn-nav-login|btn-hero-login/);
});

test('rendered dashboard scripts are valid JavaScript', async () => {
  const response = await legacyUi.fetch(new Request('https://example.test/dashboard'), env);
  const html = await response.text();
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
  assert.ok(scripts.length > 0);
  for (const [, source] of scripts) new vm.Script(source);
});

test('dashboard resource actions use real links instead of simulated redirect alerts', async () => {
  const source = await readFile(new URL('../src/ui/scripts/dashboard.js', import.meta.url), 'utf8');
  assert.match(source, /link\.href = actionUrl/);
  assert.match(source, /link\.rel = 'noopener noreferrer'/);
  assert.match(source, /belastingdienst\.nl\/wps\/wcm\/connect\/nl\/zorgtoeslag/);
  assert.doesNotMatch(source, /btn\.onclick = function\(\) \{ alert\(actionMsg\); \}/);
});

test('protected pages redirect unauthenticated requests to login', async () => {
  for (const path of ['/onboarding', '/dashboard']) {
    const response = await worker.fetch(new Request(`https://example.test${path}`), env);
    assert.equal(response.status, 303, path);
    assert.equal(response.headers.get('location'), 'https://example.test/login');
  }
});

test('authenticated root redirects to dashboard', async () => {
  const authenticatedEnv = {
    ...env,
    DB: createDb({
      first(sql) {
        if (sql.includes('FROM sessions')) return { userId: 'user-1', email: 'student@example.com', displayName: 'Student', onboardingCompletedAt: '2026-08-22T00:00:00.000Z' };
        return null;
      },
    }),
  };
  const response = await worker.fetch(new Request('https://example.test/', {
    headers: { Cookie: 'landingnl_session=opaque-session-token' },
  }), authenticatedEnv);
  assert.equal(response.status, 303);
  assert.equal(response.headers.get('location'), 'https://example.test/dashboard');
});

test('authenticated incomplete users resume onboarding and completed users cannot repeat it', async () => {
  const incompleteEnv = {
    ...env,
    DB: createDb({
      first(sql) {
        if (sql.includes('FROM sessions')) return { userId: 'user-1', email: 'student@example.com', onboardingCompletedAt: null };
        return null;
      },
    }),
  };
  const incomplete = await worker.fetch(new Request('https://example.test/dashboard', {
    headers: { Cookie: 'landingnl_session=opaque-session-token' },
  }), incompleteEnv);
  assert.equal(incomplete.status, 303);
  assert.equal(incomplete.headers.get('location'), 'https://example.test/onboarding');

  const completedEnv = {
    ...env,
    DB: createDb({
      first(sql) {
        if (sql.includes('FROM sessions')) return { userId: 'user-1', email: 'student@example.com', onboardingCompletedAt: '2026-08-22T00:00:00.000Z' };
        return null;
      },
    }),
  };
  const completed = await worker.fetch(new Request('https://example.test/onboarding', {
    headers: { Cookie: 'landingnl_session=opaque-session-token' },
  }), completedEnv);
  assert.equal(completed.status, 303);
  assert.equal(completed.headers.get('location'), 'https://example.test/dashboard');
});

test('validated onboarding completion persists state and marks the account complete', async () => {
  const writes = [];
  const onboardingEnv = {
    ...env,
    DB: createDb({
      first(sql) {
        if (sql.includes('FROM sessions')) return { userId: 'user-1', email: 'student@example.com', onboardingCompletedAt: null };
        if (sql.includes('SELECT payload_json')) return null;
        return null;
      },
      run(sql, values) {
        writes.push({ sql, values });
        return { success: true };
      },
    }),
  };
  const response = await worker.fetch(new Request('https://example.test/api/onboarding/complete', {
    method: 'PUT',
    headers: {
      Cookie: 'landingnl_session=opaque-session-token',
      Origin: 'https://example.test',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ age: '18', status: 'eu', city: 'Amsterdam', program: 'UvA - PPLE', housing: 'yes' }),
  }), onboardingEnv);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).next, '/dashboard');
  assert.ok(writes.some(({ sql }) => sql.includes('INSERT INTO user_state')));
  assert.ok(writes.some(({ sql }) => sql.includes('UPDATE users SET onboarding_completed_at')));
});

test('invalid onboarding profile cannot mark an account complete', async () => {
  const writes = [];
  const onboardingEnv = {
    ...env,
    DB: createDb({
      first(sql) {
        if (sql.includes('FROM sessions')) return { userId: 'user-1', email: 'student@example.com', onboardingCompletedAt: null };
        return null;
      },
      run(sql, values) {
        writes.push({ sql, values });
        return { success: true };
      },
    }),
  };
  const response = await worker.fetch(new Request('https://example.test/api/onboarding/complete', {
    method: 'PUT',
    headers: {
      Cookie: 'landingnl_session=opaque-session-token',
      Origin: 'https://example.test',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ age: '18', status: 'invalid', city: 'Amsterdam', program: 'UvA', housing: 'yes' }),
  }), onboardingEnv);
  assert.equal(response.status, 400);
  assert.equal(writes.length, 0);
});

test('email login cannot create a session without ownership verification', async () => {
  const response = await worker.fetch(new Request('https://example.test/api/auth/email/start', {
    method: 'POST',
    headers: { Origin: 'https://example.test', 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@example.com' }),
  }), env);
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('set-cookie'), null);
});

test('cross-origin state changes are rejected', async () => {
  const response = await worker.fetch(new Request('https://example.test/api/auth/logout', {
    method: 'POST',
    headers: { Origin: 'https://attacker.test' },
  }), env);
  assert.equal(response.status, 403);
});

test('security headers are attached', async () => {
  const response = await worker.fetch(new Request('https://example.test/'), env);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('x-frame-options'), 'DENY');
  assert.equal(response.headers.get('access-control-allow-origin'), null);
});

test('community user content is rendered through textContent', async () => {
  const source = await readFile(new URL('../src/ui/scripts/dashboard.js', import.meta.url), 'utf8');
  assert.match(source, /offerStrong\.textContent/);
  assert.doesNotMatch(source, /div\.innerHTML\s*=\s*'<div><span class="swap-tag/);
});
