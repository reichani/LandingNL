import { renderDashboardPage } from './ui/pages/dashboard.js';
import { renderLoginPage } from './ui/pages/login.js';
import { renderOnboardingPage } from './ui/pages/onboarding.js';
import { renderWelcomePage } from './ui/pages/welcome.js';

const HTML_HEADERS = {
  'Content-Type': 'text/html; charset=utf-8',
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'Access-Control-Allow-Origin': '*',
};

function html(content) {
  return new Response(content, { headers: HTML_HEADERS });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: HTML_HEADERS });
    }

    const cookieHeader = request.headers.get('Cookie') || '';
    const hasSession = cookieHeader.includes('landingnl_session=');

    if ((url.pathname === '/' || url.pathname === '') && !hasSession) {
      return html(renderWelcomePage());
    }

    if (url.pathname === '/login') {
      return html(renderLoginPage(env.GOOGLE_CLIENT_ID || ''));
    }

    if (url.pathname === '/onboarding') {
      return html(renderOnboardingPage());
    }

    if (url.pathname === '/dashboard') {
      return html(renderDashboardPage());
    }

    return new Response('Not Found', { status: 404 });
  },
};
