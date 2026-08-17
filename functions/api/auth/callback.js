import { safeInternalPath } from "../_lib/http.js";
import { readCookie, signToken, verifyToken, writeCookie } from "../_lib/session.js";

function appRedirect(url, reason) {
  const target = new URL("/app", url.origin);
  if (reason) target.searchParams.set("auth", reason);
  return Response.redirect(target.toString(), 302);
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");
  const redirectUri = env.OAUTH_REDIRECT_URI || `${url.origin}/api/auth/callback`;

  if (oauthError) return appRedirect(url, "cancelled");
  if (!code || !state || !env.SESSION_SECRET || !env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.DB) {
    return appRedirect(url, "failed");
  }

  const temporary = await verifyToken(env.SESSION_SECRET, readCookie(request, "landingnl_oauth"));
  if (!temporary || temporary.state !== state) return appRedirect(url, "state");

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) return appRedirect(url, "token");
  const tokens = await tokenResponse.json();
  if (!tokens.access_token) return appRedirect(url, "token");

  const userResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { authorization: `Bearer ${tokens.access_token}` },
  });
  if (!userResponse.ok) return appRedirect(url, "identity");

  const identity = await userResponse.json();
  if (!identity.sub || !identity.email || identity.email_verified === false) return appRedirect(url, "identity");

  await env.DB.prepare(
    `INSERT INTO users (google_sub, email, first_name, full_name, avatar_url, last_login_at)
     VALUES (?1, ?2, ?3, ?4, ?5, CURRENT_TIMESTAMP)
     ON CONFLICT(google_sub) DO UPDATE SET
       email = excluded.email,
       first_name = excluded.first_name,
       full_name = excluded.full_name,
       avatar_url = excluded.avatar_url,
       last_login_at = CURRENT_TIMESTAMP`,
  ).bind(
    String(identity.sub),
    String(identity.email),
    String(identity.given_name || ""),
    String(identity.name || ""),
    String(identity.picture || ""),
  ).run();

  const user = await env.DB.prepare(
    "SELECT id, email, first_name, full_name FROM users WHERE google_sub = ?1",
  ).bind(String(identity.sub)).first();
  if (!user?.id) return appRedirect(url, "account");

  const profile = await env.DB.prepare("SELECT user_id FROM profiles WHERE user_id = ?1").bind(user.id).first();
  const session = await signToken(env.SESSION_SECRET, {
    uid: Number(user.id),
    sub: String(identity.sub),
    email: String(user.email),
    name: String(user.first_name || user.full_name || ""),
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
  });

  const requestedNext = safeInternalPath(temporary.next, "/app");
  const destination = profile ? requestedNext : "/app/onboarding";
  const headers = new Headers({
    location: new URL(destination, url.origin).toString(),
    "cache-control": "no-store",
  });
  headers.append("set-cookie", writeCookie("landingnl_session", session, { maxAge: 30 * 24 * 60 * 60 }));
  headers.append("set-cookie", writeCookie("landingnl_oauth", "", { maxAge: 0 }));
  return new Response(null, { status: 302, headers });
}
