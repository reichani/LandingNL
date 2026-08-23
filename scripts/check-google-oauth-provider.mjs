const projectUrl = "https://iwzsewwnntfylryqaihu.supabase.co";
const publishableKey = "sb_publishable_l461HYfQDcU2_FIw3pzZFw_Lyf3mcmX";
const redirectTo = "https://landingnl.reichani.workers.dev/auth/callback";

const authorize = new URL(`${projectUrl}/auth/v1/authorize`);
authorize.searchParams.set("provider", "google");
authorize.searchParams.set("redirect_to", redirectTo);

const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 10000);

try {
  const response = await fetch(authorize, {
    method: "GET",
    redirect: "manual",
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${publishableKey}`,
    },
    signal: controller.signal,
  });

  const location = response.headers.get("location");
  let googleRedirect = false;
  if (location) {
    try {
      const target = new URL(location);
      googleRedirect = target.hostname === "accounts.google.com" || target.hostname.endsWith(".google.com");
    } catch {
      googleRedirect = false;
    }
  }

  console.log(JSON.stringify({
    status: response.status,
    redirectedToGoogle: googleRedirect,
    hasLocation: Boolean(location),
  }));

  if (response.status < 300 || response.status >= 400 || !googleRedirect) {
    const body = await response.text().catch(() => "");
    console.error(`Google provider probe failed. HTTP ${response.status}. ${body.slice(0, 500)}`);
    process.exit(1);
  }
} catch (error) {
  console.error("Google provider probe failed before receiving a response.", error instanceof Error ? error.message : error);
  process.exit(1);
} finally {
  clearTimeout(timeout);
}
