import { HttpError } from '../security.js';

const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';

function decodeBase64Url(value) {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  return Uint8Array.from(atob(normalized), (character) => character.charCodeAt(0));
}

function decodeJson(value) {
  return JSON.parse(new TextDecoder().decode(decodeBase64Url(value)));
}

export async function verifyGoogleCredential(credential, clientId) {
  if (!credential || !clientId) throw new HttpError(503, 'Google sign-in is not configured');
  const parts = credential.split('.');
  if (parts.length !== 3) throw new HttpError(401, 'Invalid Google credential');

  let header;
  let payload;
  try {
    header = decodeJson(parts[0]);
    payload = decodeJson(parts[1]);
  } catch {
    throw new HttpError(401, 'Invalid Google credential');
  }
  if (header.alg !== 'RS256' || typeof header.kid !== 'string') throw new HttpError(401, 'Unsupported Google credential');

  const keyResponse = await fetch(GOOGLE_JWKS_URL, { cf: { cacheTtl: 3600, cacheEverything: true } });
  if (!keyResponse.ok) throw new HttpError(503, 'Google verification is temporarily unavailable');
  const jwks = await keyResponse.json();
  const jwk = jwks.keys?.find((candidate) => candidate.kid === header.kid && candidate.kty === 'RSA');
  if (!jwk) throw new HttpError(401, 'Unknown Google signing key');

  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  const validSignature = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    decodeBase64Url(parts[2]),
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
  );
  const now = Math.floor(Date.now() / 1000);
  const validIssuer = payload.iss === 'accounts.google.com' || payload.iss === 'https://accounts.google.com';
  const validAudience = Array.isArray(payload.aud) ? payload.aud.includes(clientId) : payload.aud === clientId;
  if (!validSignature || !validIssuer || !validAudience || typeof payload.exp !== 'number' || payload.exp <= now) {
    throw new HttpError(401, 'Google credential verification failed');
  }
  if (typeof payload.sub !== 'string' || typeof payload.email !== 'string' || payload.email_verified !== true) {
    throw new HttpError(401, 'Verified Google account required');
  }
  return {
    subject: payload.sub,
    email: payload.email.toLowerCase(),
    name: typeof payload.name === 'string' ? payload.name : null,
  };
}
