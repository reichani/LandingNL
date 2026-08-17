import { safeInternalPath } from "../_lib/http.js";
import { randomToken, signToken, writeCookie } from "../_lib/session.js";

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const clientId = env.GOOGLE_CLIENT_ID;
  const secret = env.SESSION_SECRET;
  const redirectUri = env.OAUTH_REDIRECT_URI || `${url.origin}/api/auth/callback`;

  if (!clientId || !secret) {
    return new Response("Sign-in is temporarily unavailable.", { status: 503 });
  }

  const state = randomToken(24);
  const next = safeInternalPath(url.searchParams.get("next"), "/app");
  const temporary = await signToken(secret, {
    state,
    next,
    exp: Date.now() + 5 * 60 * 1000,
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
    access_type: "online",
  });

  return new Response(null, {
    status: 302,
    headers: {
      location: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
      "set-cookie": writeCookie("landingnl_oauth", temporary, { maxAge: 300 }),
      "cache-control": "no-store",
    },
  });
}
