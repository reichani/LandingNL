import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

import worker from '../src/index.js';
import legacyUi from '../src/legacy-ui.js';
import { upsertUser } from '../src/repositories/users.js';
import { signupAllowed } from '../src/index.js';

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

// Approved v1.0.6 baselines (journey truth-language release, see docs/adr/0007).
const PAGE_HASHES = new Map([
  ['/', '22230962a19e602c5eb6837e1e847613c0365245b46bba136ad7a772785775a6'],
  ['/login', '4ecf4cc9ec94b105e293addaa3f8ecef074f4d150dd35921b89e1603d466f45f'],
  ['/onboarding', '0d0111c19f5a7b0627084a7cfd2c38cf178a75aec85730e45371d2e36942da31'],
  ['/dashboard', '2f237080bcd3f71e0f0b19baf81d42201f956eea2ed5b9cd657c1d581b8613fc'],
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

test('the build id stays machine-readable while pages stay free of developer labels', async () => {
  const versionedEnv = {
    ...env,
    CF_VERSION_METADATA: { id: '12345678-90ab-cdef-1234-567890abcdef' },
  };
  for (const path of ['/', '/login', '/onboarding', '/dashboard', '/privacy']) {
    const html = await (await legacyUi.fetch(new Request(`https://example.test${path}`), versionedEnv)).text();
    assert.match(html, /<meta name="landingnl-build" content="v1\.0\.6 · 12345678">/, path);
    // The raw build id must never appear in visible copy, only in the meta tag.
    const visible = html.replace(/<meta[^>]*>/g, '');
    assert.doesNotMatch(visible, /12345678/, path);
    assert.doesNotMatch(visible, /<title>[^<]*v1\.0\.6/, path);
  }
  const dashboard = await (await legacyUi.fetch(new Request('https://example.test/dashboard'), versionedEnv)).text();
  assert.match(dashboard, /<span title="Sürüm">v1\.0\.6<\/span>/);
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
  // Sequential locking now lives in the step selects rather than in action buttons.
  assert.match(source, /select\.disabled = !unlocked;/);
  assert.match(source, /function stepUnlocked\(states, index\) \{/);
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

// ---- v1.0.6 production-readiness and journey truth tests ----

function jsonRequest(path, body, { method = 'POST', cookie } = {}) {
  const headers = { Origin: 'https://example.test', 'Content-Type': 'application/json' };
  if (cookie) headers.Cookie = cookie;
  return new Request(`https://example.test${path}`, { method, headers, body: JSON.stringify(body) });
}

test('a stale or prototype session cookie renders the public page and is cleared', async () => {
  const response = await worker.fetch(new Request('https://example.test/', {
    headers: { Cookie: 'landingnl_session=active' },
  }), env);
  assert.equal(response.status, 200);
  assert.match(await response.text(), /journey-start/);
  assert.match(response.headers.get('set-cookie') ?? '', /landingnl_session=; Path=\/; Max-Age=0/);
});

test('signup gate is fail-closed unless explicitly opened or invited', async () => {
  assert.equal(await signupAllowed({}, 'student@example.com'), false);
  assert.equal(await signupAllowed({ SIGNUP_MODE: 'closed_beta', DB: createDb() }, 'student@example.com'), false);
  assert.equal(await signupAllowed({ BETA_ALLOWLIST: 'a@x.nl, Student@Example.com' }, 'student@example.com'), true);
  assert.equal(await signupAllowed({ SIGNUP_MODE: 'open' }, 'anyone@example.com'), true);
  const invitedDb = createDb({ first(sql, column, values) {
    return sql.includes('FROM beta_invites') && values[0] === 'invited@example.com' ? 1 : null;
  } });
  assert.equal(await signupAllowed({ SIGNUP_MODE: 'closed_beta', DB: invitedDb }, 'Invited@Example.com'), true);
});

test('email sign-in is refused before any token is written when email is not configured', async () => {
  const writes = [];
  const trackingEnv = { ...env, DB: createDb({ run(sql, values) { writes.push(sql); return { success: true }; } }) };
  const response = await worker.fetch(jsonRequest('/api/auth/email/start', { email: 'student@example.com' }), trackingEnv);
  assert.equal(response.status, 503);
  assert.equal(writes.length, 0);
});

test('email sign-in is limited per address', async () => {
  const writes = [];
  const limitedEnv = {
    ...env,
    SIGNUP_MODE: 'open',
    BREVO_API_KEY: 'test-key',
    AUTH_FROM_EMAIL: 'no-reply@example.test',
    DB: createDb({
      first(sql) { return sql.includes('COUNT(*)') ? 3 : null; },
      run(sql) { writes.push(sql); return { success: true }; },
    }),
  };
  const response = await worker.fetch(jsonRequest('/api/auth/email/start', { email: 'student@example.com' }), limitedEnv);
  assert.equal(response.status, 429);
  assert.equal(writes.length, 0);
});

test('closed beta blocks email sign-in for addresses outside the allowlist', async () => {
  const betaEnv = { ...env, BREVO_API_KEY: 'k', AUTH_FROM_EMAIL: 'no-reply@example.test', BETA_ALLOWLIST: 'owner@example.test' };
  const response = await worker.fetch(jsonRequest('/api/auth/email/start', { email: 'student@example.com' }), betaEnv);
  assert.equal(response.status, 403);
});

test('login page hides email sign-in until it is configured and shows the beta notice', async () => {
  const closed = await (await legacyUi.fetch(new Request('https://example.test/login'), env)).text();
  assert.doesNotMatch(closed, /id="btn-email-login"/);
  assert.match(closed, /id="beta-notice"/);
  const open = await (await legacyUi.fetch(new Request('https://example.test/login'), {
    ...env, SIGNUP_MODE: 'open', BREVO_API_KEY: 'k', AUTH_FROM_EMAIL: 'no-reply@example.test',
  })).text();
  assert.match(open, /id="btn-email-login"/);
  assert.doesNotMatch(open, /id="beta-notice"/);
});

test('onboarding rejects students under 16', async () => {
  const writes = [];
  const onboardingEnv = {
    ...env,
    DB: createDb({
      first(sql) {
        if (sql.includes('FROM sessions')) return { userId: 'user-1', email: 'student@example.com', onboardingCompletedAt: null };
        return null;
      },
      run(sql) { writes.push(sql); return { success: true }; },
    }),
  };
  const response = await worker.fetch(jsonRequest('/api/onboarding/complete',
    { age: '15', status: 'eu', city: 'Amsterdam', program: 'UvA', housing: 'yes' },
    { method: 'PUT', cookie: 'landingnl_session=opaque-session-token' }), onboardingEnv);
  assert.equal(response.status, 400);
  assert.equal(writes.length, 0);
});

test('onboarding does not silently assume a birth date', async () => {
  const html = await (await legacyUi.fetch(new Request('https://example.test/onboarding'), env)).text();
  assert.doesNotMatch(html, /id="dob" value=/);
});

test('dashboard makes no simulated completion, integration or community claims', async () => {
  const html = await (await legacyUi.fetch(new Request('https://example.test/dashboard'), env)).text();
  for (const claim of [/Revolut/, /✓ Aktif/, /Aktifleşti!/, /Entegre Edildi/, /%100 tamamlandı/, /Government Free Money/,
    /kampüs panosuna eklendi/, /yönlendiriliyorsunuz/, /Huisarts Kaydınız Geçerli/, /badge active">✓ Vize/, /2026-08-19/]) {
    assert.doesNotMatch(html, claim, String(claim));
  }
  assert.match(html, /\(beyan\)/);
  assert.match(html, /Önizleme/);
});

test('saving the registration appointment date does not mark the BSN step complete', async () => {
  const source = await readFile(new URL('../src/ui/scripts/dashboard.js', import.meta.url), 'utf8');
  const saveFn = source.slice(source.indexOf('function triggerBsnSave'), source.indexOf("window.addEventListener('DOMContentLoaded'"));
  assert.match(saveFn, /Store\.set\('bsn_date', val\)/);
  assert.doesNotMatch(saveFn, /Store\.set\('step'/);
});

test('robots.txt and favicon are served without touching the database', async () => {
  const robots = await worker.fetch(new Request('https://example.test/robots.txt'), {});
  assert.equal(robots.status, 200);
  assert.match(await robots.text(), /Disallow: \/dashboard/);
  const favicon = await worker.fetch(new Request('https://example.test/favicon.ico'), {});
  assert.equal(favicon.status, 204);
});

test('privacy notice is public and linked before sign-in', async () => {
  const privacy = await worker.fetch(new Request('https://example.test/privacy'), env);
  assert.equal(privacy.status, 200);
  const body = await privacy.text();
  assert.match(body, /Veri sorumlusu/);
  assert.match(body, /Autoriteit Persoonsgegevens/);
  for (const path of ['/', '/login']) {
    const page = await (await worker.fetch(new Request(`https://example.test${path}`), env)).text();
    assert.match(page, /href="\/privacy"/, path);
  }
});

test('production config opens Google sign-in', async () => {
  const config = await readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8');
  const production = config.slice(config.indexOf('"production"'));
  assert.match(production, /"SIGNUP_MODE": "open"/);
  assert.match(production, /"workers_dev": false/);
});

test('the journey branches on EU/EEA versus non-EU status', async () => {
  const source = await readFile(new URL('../src/ui/scripts/dashboard.js', import.meta.url), 'utf8');
  const route = source.slice(source.indexOf('function renderStatusRoute'), source.indexOf('function renderAllowances'));
  assert.match(route, /Store\.get\('status', 'non_eu'\) === 'eu'/);
  assert.match(route, /VVR/);
  assert.match(route, /MVV/);
  assert.match(route, /TWV/);
  assert.match(route, /ind\.nl\/en\/residence-permits\/eu-eea-and-swiss-citizens/);
  assert.match(route, /ind\.nl\/en\/residence-permits\/study/);
  // Route content is written with textContent, never innerHTML concatenation.
  assert.doesNotMatch(route, /innerHTML\s*\+?=\s*[^\']*\+/);
  const html = await (await legacyUi.fetch(new Request('https://example.test/dashboard'), env)).text();
  assert.match(html, /id="status-route"/);
});

test('the school step covers real institutions and always allows a free-text fallback', async () => {
  const html = await (await legacyUi.fetch(new Request('https://example.test/onboarding'), env)).text();
  for (const school of ['Universiteit van Amsterdam (UvA)', 'Technische Universiteit Delft (TU Delft)',
    'Rijksuniversiteit Groningen (RUG)', 'Universiteit Maastricht (UM)', 'NHL Stenden Hogeschool']) {
    assert.ok(html.includes(school), school);
  }
  assert.match(html, /id="school-other"/);
  assert.match(html, /id="city-other"/);
  // The school name is no longer fused with a single hardcoded programme.
  assert.doesNotMatch(html, /UvA\) - PPLE/);
  const cityCount = (html.match(/<option value="(?!__other__)[^"]+">/g) || []).length;
  assert.ok(cityCount >= 18, `expected the full city list, saw ${cityCount}`);
});

test('allowances and own health insurance are gated on the Dutch 18+ rule', async () => {
  const source = await readFile(new URL('../src/ui/scripts/dashboard.js', import.meta.url), 'utf8');
  assert.match(source, /var ALLOWANCE_MIN_AGE = 18;/);
  const allowances = source.slice(source.indexOf('function renderAllowances'), source.indexOf('function renderPerks'));
  assert.match(allowances, /if \(!isAdultForAllowances\(\)\) \{/);
  // The under-18 branch returns before any huurtoeslag or zorgtoeslag card is built.
  const guard = allowances.slice(0, allowances.indexOf('return;'));
  assert.doesNotMatch(guard, /Huurtoeslag|Zorgtoeslag/);
  const insurance = source.slice(source.indexOf('function renderInsuranceTree'), source.indexOf('function completeStep'));
  assert.ok(insurance.indexOf('!isAdultForAllowances()') < insurance.indexOf('if (!isWorking) {'));
  assert.match(insurance, /ebeveynin/);
});

test('the registration appointment cannot be set in the past', async () => {
  const source = await readFile(new URL('../src/ui/scripts/dashboard.js', import.meta.url), 'utf8');
  assert.match(source, /dateInput\.min = todayIso\(\);/);
  assert.match(source, /if \(val < todayIso\(\)\) return alert/);
});

test('list tags wrap instead of overlapping their label', async () => {
  const html = await (await legacyUi.fetch(new Request('https://example.test/dashboard'), env)).text();
  assert.doesNotMatch(html, /\.tag \{[^}]*min-width: 105px/);
  assert.match(html, /\.item > span:first-child \{ flex: 1 1 auto; min-width: 0; \}/);
});

test('a completed profile can be reopened and corrected', async () => {
  const completedEnv = {
    ...env,
    DB: createDb({
      first(sql) {
        if (sql.includes('FROM sessions')) {
          return { userId: 'user-1', email: 'student@example.com', onboardingCompletedAt: '2026-09-01T00:00:00.000Z' };
        }
        return null;
      },
    }),
  };
  const cookie = { Cookie: 'landingnl_session=opaque-session-token' };

  // Without ?edit the completed profile still goes straight to the dashboard.
  const plain = await worker.fetch(new Request('https://example.test/onboarding', { headers: cookie }), completedEnv);
  assert.equal(plain.status, 303);
  assert.match(plain.headers.get('location'), /\/dashboard$/);

  // With ?edit the form is served again.
  const editing = await worker.fetch(new Request('https://example.test/onboarding?edit=1', { headers: cookie }), completedEnv);
  assert.equal(editing.status, 200);
  const html = await editing.text();
  assert.match(html, /id="edit-banner"/);
  assert.match(html, /EDIT_MODE/);
  assert.match(html, /if \(EDIT_MODE\) prefillFromServer\(\);/);

  const dashboard = await (await legacyUi.fetch(new Request('https://example.test/dashboard'), env)).text();
  assert.match(dashboard, /href="\/onboarding\?edit=1"/);
});

test('the edit form restores a stored school that is not in the list', async () => {
  const source = await readFile(new URL('../src/ui/pages/onboarding.js', import.meta.url), 'utf8');
  assert.match(source, /function splitProgram/);
  assert.match(source, /function selectOrOther/);
  // An unknown value falls back to the free-text input rather than being dropped.
  const helper = source.slice(source.indexOf('function selectOrOther'), source.indexOf('async function prefillFromServer'));
  assert.match(helper, /select\.value = OTHER;/);
});

test('each Settle step tracks three states, not a single marked flag', async () => {
  const html = await (await legacyUi.fetch(new Request('https://example.test/dashboard'), env)).text();
  for (let i = 1; i <= 4; i += 1) assert.match(html, new RegExp(`id="step-state-${i}"`));
  assert.doesNotMatch(html, /id="btn-step-\d"/);

  const source = await readFile(new URL('../src/ui/scripts/dashboard.js', import.meta.url), 'utf8');
  assert.match(source, /var STATES = \['todo', 'doing', 'done'\];/);
  assert.match(source, /todo: 'Başlamadım'/);
  assert.match(source, /doing: 'Başladım, bekliyorum'/);
  assert.match(source, /done: 'Tamamlandı'/);
  // Legacy accounts that only stored a completed-step counter still read correctly.
  const read = source.slice(source.indexOf('function readStepStates'), source.indexOf('function writeStepStates'));
  assert.match(read, /var legacy = parseInt\(Store\.get\('step', '0'\), 10\)/);
  // Stepping back from done clears the later steps after a confirmation.
  const setter = source.slice(source.indexOf('function setStepState'), source.indexOf('function renderStepControls'));
  assert.match(setter, /for \(var i = index \+ 1; i < 4; i\+\+\) states\[i\] = 'todo';/);
  assert.match(setter, /confirm\('Bu adımı geri alırsan/);
});

test('progress counts only finished steps and names the ones in progress', async () => {
  const source = await readFile(new URL('../src/ui/scripts/dashboard.js', import.meta.url), 'utf8');
  assert.match(source, /var score = doneCount \* 25;/);
  assert.match(source, /adım sürüyor/);
});

test('finishing the Settle steps opens a concrete next-phase panel', async () => {
  const html = await (await legacyUi.fetch(new Request('https://example.test/dashboard'), env)).text();
  assert.match(html, /<div class="card hidden" id="next-phase"/);
  const source = await readFile(new URL('../src/ui/scripts/dashboard.js', import.meta.url), 'utf8');
  const next = source.slice(source.indexOf('function renderNextPhase'), source.indexOf('var defaultPosts'));
  for (const item of ['Sağlık sigortası', 'Devlet destekleri', 'Öğrenci indirimleri']) {
    assert.ok(next.includes(item), item);
  }
  // The non-EU route gets the extra work-permit reminder.
  assert.match(next, /if \(!isEU\) items\.push/);
  assert.match(source, /if \(nextBox && focus !== -1\) nextBox\.classList\.add\('hidden'\)/);
});

test('pilot users have a feedback route and sign-up stays open', async () => {
  const html = await (await legacyUi.fetch(new Request('https://example.test/dashboard'), env)).text();
  assert.match(html, /Geri bildirim gönder/);
  assert.match(html, /mailto:reichani@gmail\.com\?subject=LandingNL/);
  const config = await readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8');
  const production = config.slice(config.indexOf('"production"'));
  assert.match(production, /"SIGNUP_MODE": "open"/);
});
