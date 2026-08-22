import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

import worker from '../src/index.js';
import legacyUi from '../src/legacy-ui.js';
import { upsertUser } from '../src/repositories/users.js';

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
  ['/', '4b1cf3903d0433e2c7e063ac2c41a1c1870ef3ae23e2f6a15d892602f6dcfdc9'],
  ['/login', '5ba905aa143c94bcce95f103e85a3011e9e672010ad046a563d739198de74c1c'],
  ['/onboarding', '5b8ea9796faa156f18cf4090b097ad62337d94221c90a5238bc2ec3121eb79de'],
  ['/dashboard', '0de6bbfc537b4bacdea3584d4a815f4e3fe3e37be67c367037fea2e376ab8aa7'],
]);

test('returning Google users are updated by scalar user id', async () => {
  const writes = [];
  const returningUserEnv = {
    DB: createDb({
      first(sql) {
        if (sql.includes('FROM users')) {
          return { id: 'user-1', onboardingCompletedAt: '2026-08-22T00:00:00.000Z' };
        }
        return null;
      },
      run(sql, values) {
        writes.push({ sql, values });
        return { success: true };
      },
    }),
  };

  const result = await upsertUser(returningUserEnv, {
    provider: 'google',
    subject: 'google-subject',
    email: 'student@example.com',
    name: 'Student',
  });

  assert.deepEqual(result, { userId: 'user-1', onboardingCompleted: true });
  assert.equal(writes.length, 1);
  assert.equal(writes[0].values[3], 'user-1');
  assert.equal(typeof writes[0].values[3], 'string');
});

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

test('every page exposes the semantic release and Cloudflare deployment id', async () => {
  const versionedEnv = {
    ...env,
    CF_VERSION_METADATA: { id: '12345678-90ab-cdef-1234-567890abcdef' },
  };
  for (const path of ['/', '/login', '/onboarding', '/dashboard']) {
    const response = await legacyUi.fetch(new Request(`https://example.test${path}`), versionedEnv);
    assert.match(await response.text(), /v1\.0\.5 · 12345678/, path);
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
  assert.match(source, /https:\/\/www\.isic\.nl\/en/);
  assert.doesNotMatch(source, /btn\.onclick = function\(\) \{ alert\(actionMsg\); \}/);
});

test('exchange board supports no-return Give Away listings', async () => {
  const response = await legacyUi.fetch(new Request('https://example.test/dashboard'), env);
  const html = await response.text();
  assert.match(html, /<option value="🎁 Give Away">🎁 Give Away \(Ücretsiz Ver\)<\/option>/);
  assert.match(html, /id="btn-give-away"/);
  assert.match(html, /Ücretsiz – karşılık beklemiyorum/);
});

test('completed journey actions are disabled until an editable value changes', async () => {
  const source = await readFile(new URL('../src/ui/scripts/dashboard.js', import.meta.url), 'utf8');
  assert.match(source, /button\.disabled = disabled/);
  assert.match(source, /setActionState\(btn1, step >= 1\)/);
  assert.match(source, /setActionState\(btn2, step < 1 \|\| step >= 2\)/);
  assert.match(source, /changed \? 'Değişikliği Kaydet ➔' : '✓ Tarih Kaydedildi'/);
  assert.doesNotMatch(source, /dateInput\.addEventListener\('change', function\(\) \{\s*triggerBsnSave\(\)/);
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
