export const PRIVACY_NOTICE_VERSION = '1.0 · 10 September 2026';

export function renderPrivacyPage(releaseLabel = 'v1.0.6', buildMeta = '') {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LandingNL • Privacy Notice</title>
  ${buildMeta}
  <style>
    :root { --bg: #080c14; --card: #111827; --text: #f8fafc; --muted: #94a3b8; --border: rgba(255,255,255,0.08); }
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: var(--bg); color: var(--text); margin: 0; padding: 20px; line-height: 1.6; }
    main { max-width: 720px; margin: 0 auto; background: var(--card); border: 1px solid var(--border); border-radius: 20px; padding: 28px; }
    h1 { font-size: 1.5rem; margin: 0 0 4px 0; }
    h2 { font-size: 1.05rem; margin: 24px 0 6px 0; color: #fff; }
    p, li { color: #cbd5e1; font-size: 0.9rem; }
    .meta { color: var(--muted); font-size: 0.78rem; }
    a { color: #93c5fd; }
  </style>
</head>
<body>
  <main>
    <h1>Privacy Notice</h1>
    <p class="meta">Notice version ${PRIVACY_NOTICE_VERSION}</p>

    <h2>Who is responsible</h2>
    <p>LandingNL is operated by Reyhan Açar. For any privacy request: <a href="mailto:reichani@gmail.com">reichani@gmail.com</a></p>

    <h2>What we process</h2>
    <ul>
      <li>When you sign in with Google: your email address, your name and your Google account id.</li>
      <li>What you enter during setup: your age, whether you hold an EU/EEA or Swiss passport, your city, your school or programme and your housing situation.</li>
      <li>Your journey records: the status you set for each step, your municipal appointment date and your swap drafts. We never ask for your BSN — please do not enter it anywhere.</li>
      <li>Session data: one strictly necessary cookie that keeps you signed in. Only a hashed value of that cookie is stored on the server.</li>
      <li>Technical logs: the IP address, browser information and request time kept by our hosting provider for security and troubleshooting.</li>
    </ul>

    <h2>Why, and on what legal basis</h2>
    <p>We process your data to create your account and show you your personal journey, in order to provide the service you asked for (GDPR art. 6(1)(b)). Technical logs are processed on the basis of legitimate interests, for security, abuse prevention and troubleshooting (GDPR art. 6(1)(f)). We do not sell your data and we do not use it for advertising or profiling.</p>

    <h2>Who it is shared with</h2>
    <p>Cloudflare is used for hosting and the database, and Google for sign-in, both acting as processors. These companies may process data outside the European Economic Area; such transfers rely on safeguards such as the EU Standard Contractual Clauses or the EU–US Data Privacy Framework. When you sign in with Google, Google may set cookies under its own privacy policy.</p>

    <h2>How long it is kept</h2>
    <p>Your account data is kept for as long as your account exists. Sessions last at most 30 days and email sign-in links expire after 15 minutes. If you ask us to delete your account, your data is deleted within 30 days.</p>

    <h2>Your rights</h2>
    <p>You have the right to access, rectify and erase your data, to object to processing and to receive your data in a portable format. Send your request from your registered email address to <a href="mailto:reichani@gmail.com">reichani@gmail.com</a>. You also have the right to lodge a complaint with the Dutch data protection authority, Autoriteit Persoonsgegevens.</p>

    <h2>Age limit</h2>
    <p>LandingNL is intended for students aged 16 and over.</p>

    <h2>Cookies</h2>
    <p>We only use the session cookie that is strictly necessary to keep you signed in. We use no tracking or advertising cookies.</p>

    <p class="meta"><a href="/">← Home</a> · <a href="/login">Sign in</a></p>
  </main>
</body>
</html>`;
}
