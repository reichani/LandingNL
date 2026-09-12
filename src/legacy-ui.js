import { renderDashboardPage } from './ui/pages/dashboard.js';
import { renderLoginPage } from './ui/pages/login.js';
import { renderOnboardingPage } from './ui/pages/onboarding.js';
import { renderWelcomePage } from './ui/pages/welcome.js';
import { renderPrivacyPage } from './ui/pages/privacy.js';
import { buildMetaTag, getPublicVersion, getReleaseLabel, seoTags } from './version.js';
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
    const releaseLabel = getPublicVersion();
    const buildMeta = buildMetaTag(env);
    const meta = (options) => `${buildMetaTag(env)}\n  ${seoTags(env, options)}`;

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: HTML_HEADERS });
    }

    // Session routing is decided by src/index.js; this module only renders pages.
    if (url.pathname === '/' || url.pathname === '') {
      return html(renderWelcomePage(releaseLabel, meta({ path: '/', title: 'LandingNL — land in the Netherlands without missing a step' })));
    }

    if (url.pathname === '/login') {
      return html(renderLoginPage(env.GOOGLE_CLIENT_ID || '', releaseLabel, {
        emailLoginEnabled: emailLoginConfigured(env),
        closedBeta: env.SIGNUP_MODE !== 'open',
        buildMeta: meta({ path: '/login', title: 'LandingNL — Sign in' }),
      }));
    }

    if (url.pathname === '/privacy') {
      return html(renderPrivacyPage(releaseLabel, meta({ path: '/privacy', title: 'LandingNL — Privacy Notice', description: 'How LandingNL processes your data, on what legal basis, for how long, and how to exercise your rights.' })));
    }

    if (url.pathname === '/onboarding') {
      return html(renderOnboardingPage(releaseLabel, meta({ path: '/onboarding', title: 'LandingNL — Setup', noindex: true })));
    }

    if (url.pathname === '/dashboard') {
      return html(renderDashboardPage(releaseLabel, meta({ path: '/dashboard', title: 'LandingNL — My journey', noindex: true })));
    }

    return new Response('Not Found', { status: 404 });
  },
};
