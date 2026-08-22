import test from 'node:test';
import assert from 'node:assert/strict';

import worker from '../src/index.js';

const env = { GOOGLE_CLIENT_ID: 'test-client-id.apps.googleusercontent.com' };

test('public landing page is served without a session', async () => {
  const response = await worker.fetch(new Request('https://example.test/'), env);
  assert.equal(response.status, 200);
  assert.match(await response.text(), /LandingNL/);
});

test('login page receives the configured Google client id', async () => {
  const response = await worker.fetch(new Request('https://example.test/login'), env);
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /test-client-id\.apps\.googleusercontent\.com/);
});

test('onboarding and dashboard routes remain available', async () => {
  for (const path of ['/onboarding', '/dashboard']) {
    const response = await worker.fetch(new Request(`https://example.test${path}`), env);
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get('content-type') ?? '', /text\/html/);
  }
});

test('unknown routes return 404', async () => {
  const response = await worker.fetch(new Request('https://example.test/not-found'), env);
  assert.equal(response.status, 404);
});
