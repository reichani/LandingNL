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
      subject: 'LandingNL giriş bağlantın',
      textContent: `LandingNL hesabına giriş yapmak için bu bağlantıyı 15 dakika içinde aç: ${link}`,
      htmlContent: `<p>LandingNL hesabına giriş yapmak için aşağıdaki bağlantıyı 15 dakika içinde aç:</p><p><a href="${link}">LandingNL’ye giriş yap</a></p><p>Bu isteği siz yapmadıysanız e-postayı yok sayabilirsiniz.</p>`,
    }),
  });
  if (!response.ok) throw new HttpError(503, 'Email could not be sent');
}
