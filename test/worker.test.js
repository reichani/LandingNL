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
  ['/', '066013fc9c34a55b10228ad6868ddf397418e8acad4245f1d8ee11bdad0ee785'],
  ['/login', '3cafba3453a201269063aaea12c5af15e6b193dab7957b2aa43e6e1309f4f676'],
  ['/onboarding', '202ee18456fce810dee0ce4f676ee241eb53c066cce97e6b319958f1ea668cf4'],
  ['/dashboard', '48acda7d8098cc303858bd639a3f8f91619e6a9c4df64b91a31e9c25a9401f55'],
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
  assert.match(dashboard, /<span title="Version">v1\.0\.6<\/span>/);
});

test('welcome page has one resilient journey entry and no header login action', async () => {
  const response = await legacyUi.fetch(new Request('https://example.test/'), env);
  const html = await response.text();
  assert.match(html, /<a class="cta" id="journey-start" href="\/login">Start — sign in with Google ➔<\/a>/);
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

test.skip('exchange board supports no-return Give Away listings', async () => {
  const response = await legacyUi.fetch(new Request('https://example.test/dashboard'), env);
  const html = await response.text();
  assert.match(html, /<option value="🎁 Give away">🎁 Give away \(free\)<\/option>/);
  assert.match(html, /id="btn-give-away"/);
  assert.match(html, /Free — nothing expected in return/);
});

test('completed journey actions are disabled until an editable value changes', async () => {
  const source = await readFile(new URL('../src/ui/scripts/dashboard.js', import.meta.url), 'utf8');
  assert.match(source, /button\.disabled = disabled/);
  // Sequential locking now lives in the step selects rather than in action buttons.
  assert.match(source, /select\.disabled = !unlocked;/);
  assert.match(source, /function stepUnlocked\(states, index\) \{/);
  assert.match(source, /changed \? 'Save change ➔' : '✓ Date saved'/);
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
  assert.match(html, /self-reported|coming later/);
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
  assert.match(body, /Who is responsible/);
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
  assert.match(insurance, /insured through a parent/);
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
  assert.match(source, /todo: 'Not started'/);
  assert.match(source, /doing: 'Applied, waiting'/);
  assert.match(source, /done: 'Done'/);
  // Legacy accounts that only stored a completed-step counter still read correctly.
  const read = source.slice(source.indexOf('function readStepStates'), source.indexOf('function writeStepStates'));
  assert.match(read, /var legacy = parseInt\(Store\.get\('step', '0'\), 10\)/);
  // Stepping back from done clears the later steps after a confirmation.
  const setter = source.slice(source.indexOf('function setStepState'), source.indexOf('function renderStepControls'));
  assert.match(setter, /for \(var i = index \+ 1; i < 4; i\+\+\) states\[i\] = 'todo';/);
  assert.match(setter, /confirm\('Moving this step back/);
});

test('progress counts only finished steps and names the ones in progress', async () => {
  const source = await readFile(new URL('../src/ui/scripts/dashboard.js', import.meta.url), 'utf8');
  assert.match(source, /var score = doneCount \* 25;/);
  assert.match(source, /in progress/);
});

test('finishing the Settle steps opens a concrete next-phase panel', async () => {
  const html = await (await legacyUi.fetch(new Request('https://example.test/dashboard'), env)).text();
  assert.match(html, /<div class="card hidden" id="next-phase"/);
  const source = await readFile(new URL('../src/ui/scripts/dashboard.js', import.meta.url), 'utf8');
  const next = source.slice(source.indexOf('function renderNextPhase'), source.indexOf('var defaultPosts'));
  for (const item of ['Health insurance', 'Allowances', 'Student discounts']) {
    assert.ok(next.includes(item), item);
  }
  // The non-EU route gets the extra work-permit reminder.
  assert.match(next, /if \(!isEU\) items\.push/);
  assert.match(source, /if \(nextBox && focus !== -1\) nextBox\.classList\.add\('hidden'\)/);
});

test('pilot users have a feedback route and sign-up stays open', async () => {
  const html = await (await legacyUi.fetch(new Request('https://example.test/dashboard'), env)).text();
  assert.match(html, /Send feedback/);
  assert.match(html, /mailto:reichani@gmail\.com\?subject=LandingNL/);
  const config = await readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8');
  const production = config.slice(config.indexOf('"production"'));
  assert.match(production, /"SIGNUP_MODE": "open"/);
});

test('the dashboard opens with the next step, not with a status summary', async () => {
  const html = await (await legacyUi.fetch(new Request('https://example.test/dashboard'), env)).text();
  // The hero sits above the progress box in the document.
  assert.ok(html.indexOf('id="next-action"') < html.indexOf('class="progress-box"'));
  assert.doesNotMatch(html, /savings-banner/);
  assert.match(html, /id="next-action-state"/);

  const source = await readFile(new URL('../src/ui/scripts/dashboard.js', import.meta.url), 'utf8');
  const hero = source.slice(source.indexOf('function renderNextAction'), source.indexOf('function renderStepControls'));
  // A student who has not touched anything yet is told where to begin.
  assert.match(hero, /'Start here · '/);
  assert.match(hero, /select\.onchange = function\(\) \{ setStepState\(focus, this\.value\); \};/);
});

test('the unfinished swaps board is not presented as a main tab', async () => {
  const html = await (await legacyUi.fetch(new Request('https://example.test/dashboard'), env)).text();
  assert.doesNotMatch(html, /id="t3"/);
  assert.doesNotMatch(html, /id="view-3"/);
  assert.doesNotMatch(html, /id="modal-box"/);
  assert.match(html, /Student swaps — a place to trade food, skills and gear with other students — is coming later\./);
  const source = await readFile(new URL('../src/ui/scripts/dashboard.js', import.meta.url), 'utf8');
  assert.match(source, /var tabs = \[1, 2\];/);
});

test('the route card collapses once the first step is done', async () => {
  const source = await readFile(new URL('../src/ui/scripts/dashboard.js', import.meta.url), 'utf8');
  const route = source.slice(source.indexOf('function renderStatusRoute'), source.indexOf('function renderAllowances'));
  assert.match(route, /details\.open = states\[0\] !== 'done';/);
  assert.match(route, /document\.createElement\('summary'\)/);
});

test('a saved appointment turns into a visible countdown', async () => {
  const source = await readFile(new URL('../src/ui/scripts/dashboard.js', import.meta.url), 'utf8');
  const helper = source.slice(source.indexOf('function countdownText'), source.indexOf('function cleanIsoDate'));
  assert.match(helper, /is in ' \+ days \+ ' days/);
  assert.match(helper, /is tomorrow/);
  assert.match(helper, /is today/);
  // The countdown also leads the hero card while step 1 is the focus.
  const hero = source.slice(source.indexOf('function renderNextAction'), source.indexOf('function renderStepControls'));
  assert.match(hero, /if \(focus === 0\) \{/);
  const html = await (await legacyUi.fetch(new Request('https://example.test/dashboard'), env)).text();
  assert.match(html, /id="bsn-countdown"/);
});

test('students can pass the app on', async () => {
  const html = await (await legacyUi.fetch(new Request('https://example.test/dashboard'), env)).text();
  assert.match(html, /id="btn-share"/);
  const source = await readFile(new URL('../src/ui/scripts/dashboard.js', import.meta.url), 'utf8');
  const share = source.slice(source.indexOf("getElementById('btn-share')"), source.indexOf("getElementById('btn-reset-app')"));
  assert.match(share, /navigator\.share/);
  // Falls back to the clipboard where the share sheet is unavailable.
  assert.match(share, /navigator\.clipboard\.writeText\(shareData\.url\)/);
});

test('public pages carry link preview metadata and private pages stay out of search', async () => {
  for (const path of ['/', '/login', '/privacy']) {
    const html = await (await legacyUi.fetch(new Request(`https://example.test${path}`), env)).text();
    assert.match(html, /<meta name="description" content="[^"]{40,}">/, path);
    assert.match(html, /<meta property="og:title"/, path);
    assert.match(html, /<link rel="canonical" href="https:\/\/landingnl\.com/, path);
    assert.doesNotMatch(html, /noindex/, path);
  }
  for (const path of ['/onboarding', '/dashboard']) {
    const html = await (await legacyUi.fetch(new Request(`https://example.test${path}`), env)).text();
    assert.match(html, /<meta name="robots" content="noindex, nofollow">/, path);
  }
});

test('public transport guidance never promises a discount the student may not have', async () => {
  const html = await (await legacyUi.fetch(new Request('https://example.test/dashboard'), env)).text();
  assert.match(html, /id="transport-grid"/);

  const source = await readFile(new URL('../src/ui/scripts/dashboard.js', import.meta.url), 'utf8');
  const transport = source.slice(source.indexOf('function renderTransport'), source.indexOf('function renderInsuranceTree'));
  // Eligibility is framed as a check, tied to DUO student finance.
  assert.match(transport, /Check whether you qualify/);
  assert.match(transport, /DUO/);
  assert.match(transport, /studentenreisproduct\.nl\/en\/i-am-a-foreign-student/);
  // The summer exception and the check-out trap are stated, not glossed over.
  assert.match(transport, /16 July to 16 August/);
  assert.match(transport, /40% discount on the train and a 34% discount on bus, tram and metro/);
  assert.match(transport, /Always check out/);
  // No card claims free travel outright.
  assert.doesNotMatch(transport, /travel for free with your student card/i);
});
