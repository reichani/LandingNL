import { renderDashboardPage } from './ui/pages/dashboard.js';
import { renderLoginPage } from './ui/pages/login.js';
import { renderOnboardingPage } from './ui/pages/onboarding.js';
import { renderWelcomePage } from './ui/pages/welcome.js';
import { renderPrivacyPage } from './ui/pages/privacy.js';
import { getReleaseLabel } from './version.js';
import { emailLoginConfigured } from './email/brevo.js';

const HTML_HEADERS = {
  'Content-Type': 'text/html; charset=utf-8',
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
};

function html(content) {
  return new Response(content, { headers: HTML_HEADERS });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const releaseLabel = getReleaseLabel(env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: HTML_HEADERS });
    }

    // Session routing is decided by src/index.js; this module only renders pages.
    if (url.pathname === '/' || url.pathname === '') {
      return html(renderWelcomePage(releaseLabel));
    }

    if (url.pathname === '/login') {
      return html(renderLoginPage(env.GOOGLE_CLIENT_ID || '', releaseLabel, {
        emailLoginEnabled: emailLoginConfigured(env),
        closedBeta: env.SIGNUP_MODE !== 'open',
      }));
    }

    if (url.pathname === '/privacy') {
      return html(renderPrivacyPage(releaseLabel));
    }

    if (url.pathname === '/onboarding') {
      return html(renderOnboardingPage(releaseLabel));
    }

    if (url.pathname === '/dashboard') {
      return html(renderDashboardPage(releaseLabel));
    }

    return new Response('Not Found', { status: 404 });
  },
};
