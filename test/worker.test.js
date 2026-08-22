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
      const statement = {
        bind() { return statement; },
        async first(column) {
          if (overrides.first) return overrides.first(sql, column);
          return null;
        },
        async all() { return { results: [] }; },
        async run() { return { success: true }; },
      };
      return statement;
    },
  };
}

const env = { DB: createDb(), GOOGLE_CLIENT_ID: 'test-client-id.apps.googleusercontent.com' };

const PAGE_HASHES = new Map([
  ['/', 'a17866c0e38a2bd841d4bd2c5f4fb089b4e59319830aa28a89f4286dbe32a171'],
  ['/login', '1b46e366a392579600f9c0503b79d1990875ac97e9fb549e665e1ac73299a522'],
  ['/onboarding', '07cc33a8446f0db639b8f9e6da0f4275d649b22a474984120282609a2f2b5ad3'],
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
        if (sql.includes('FROM sessions')) return { userId: 'user-1', email: 'student@example.com', displayName: 'Student' };
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
