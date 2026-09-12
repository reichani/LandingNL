import { HttpError } from '../security.js';

export function emailLoginConfigured(env) {
  return Boolean(env.BREVO_API_KEY && env.AUTH_FROM_EMAIL);
}

export async function sendMagicLink(env, recipient, link) {
  if (!emailLoginConfigured(env)) {
    throw new HttpError(503, 'Email sign-in is not configured');
  }
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': env.BREVO_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'LandingNL', email: env.AUTH_FROM_EMAIL },
      to: [{ email: recipient }],
      subject: 'Your LandingNL sign-in link',
      textContent: `Open this link within 15 minutes to sign in to LandingNL: ${link}`,
      htmlContent: `<p>Open the link below within 15 minutes to sign in to LandingNL:</p><p><a href="${link}">Sign in to LandingNL</a></p><p>If you did not request this, you can ignore this email.</p>`,
    }),
  });
  if (!response.ok) throw new HttpError(503, 'Email could not be sent');
}
