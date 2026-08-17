const encoder = new TextEncoder();
const decoder = new TextDecoder();

function b64urlFromBytes(bytes) {
  let text = "";
  for (const byte of bytes) text += String.fromCharCode(byte);
  return btoa(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function bytesFromB64url(value) {
  let text = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  while (text.length % 4) text += "=";
  const binary = atob(text);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function encodeJson(value) {
  return b64urlFromBytes(encoder.encode(JSON.stringify(value)));
}

function decodeJson(value) {
  return JSON.parse(decoder.decode(bytesFromB64url(value)));
}

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function signToken(secret, payload) {
  const body = encodeJson(payload);
  const key = await hmacKey(secret);
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(body)));
  return `${body}.${b64urlFromBytes(signature)}`;
}

export async function verifyToken(secret, token) {
  if (!secret || !token || typeof token !== "string" || !token.includes(".")) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  try {
    const key = await hmacKey(secret);
    const valid = await crypto.subtle.verify("HMAC", key, bytesFromB64url(signature), encoder.encode(body));
    if (!valid) return null;
    const payload = decodeJson(body);
    if (!payload || (payload.exp && Date.now() > payload.exp)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function randomToken(length = 32) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return b64urlFromBytes(bytes);
}

export function readCookie(request, name) {
  const cookies = request.headers.get("cookie") || "";
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = cookies.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function writeCookie(name, value, options = {}) {
  let cookie = `${name}=${encodeURIComponent(value)}; Path=${options.path || "/"}`;
  if (options.maxAge != null) cookie += `; Max-Age=${options.maxAge}`;
  cookie += "; HttpOnly; Secure; SameSite=Lax";
  return cookie;
}

export async function requireSession(request, env) {
  if (!env.SESSION_SECRET) return null;
  const token = readCookie(request, "landingnl_session");
  const session = await verifyToken(env.SESSION_SECRET, token);
  if (!session || !Number.isInteger(session.uid) || session.uid <= 0) return null;
  return session;
}
