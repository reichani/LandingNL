import fs from "node:fs";
import path from "node:path";

const failures = [];
const read = (filePath) => fs.readFileSync(filePath, "utf8");
const exists = (filePath) => fs.existsSync(filePath);

function fail(message) {
  failures.push(message);
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

const css = read("src/app/globals.css");
const onboarding = read("src/app/onboarding/page.tsx");
const login = read("src/app/login/page.tsx");
const callback = read("src/app/auth/callback/route.ts");
const oauthStartPath = "src/app/auth/google/route.ts";
const oauthStart = exists(oauthStartPath) ? read(oauthStartPath) : "";
const googleButtonPath = "src/app/login/GoogleSignInButton.tsx";
const googleButton = exists(googleButtonPath) ? read(googleButtonPath) : "";
const nav = read("src/components/PrimaryNav.tsx");
const foundation = read("supabase/migrations/0001_foundation.sql");
const authBootstrap = read("supabase/migrations/0002_auth_profile_bootstrap.sql");
const authHardeningPath = "supabase/migrations/0012_authorization_integrity_hardening.sql";
const authHardening = exists(authHardeningPath) ? read(authHardeningPath) : "";
const sharePage = read("src/app/share/[token]/page.tsx");
const supporterPage = read("src/app/supporter/page.tsx");
const supporterActions = read("src/app/supporter/actions.ts");
const adminRules = read("src/app/admin/rules/page.tsx");
const nextConfig = read("next.config.ts");
const packageJson = JSON.parse(read("package.json"));

// Geometry: permanent product cards must never be tilted/skewed.
if (/\brotate\s*\(/i.test(css)) fail("UX geometry gate: rotate() is not allowed in product CSS.");
if (/\bskew(?:X|Y)?\s*\(/i.test(css)) fail("UX geometry gate: skew() is not allowed in product CSS.");

const hoverRule = css.match(/\.feature-card:hover\s*\{([^}]*)\}/s)?.[1] ?? "";
if (/transform\s*:/i.test(hoverRule)) {
  fail("UX geometry gate: feature cards may not move/tilt on hover; use border/shadow feedback only.");
}

const previewRule = css.match(/\.product-preview\s*\{([^}]*)\}/s)?.[1] ?? "";
if (!/transform\s*:\s*none/i.test(previewRule)) {
  fail("UX geometry gate: .product-preview must explicitly remain transform: none.");
}

// Auth: OAuth starts in a server route so browser bundle/config failures cannot block the first redirect.
if (!exists(oauthStartPath)) {
  fail("Auth architecture gate: server-side /auth/google OAuth start route is required.");
} else {
  if (!/from\s+["']@\/lib\/supabase\/server["']/.test(oauthStart)) {
    fail("Auth architecture gate: /auth/google must use the SSR server Supabase client.");
  }
  if (!/signInWithOAuth\s*\(/.test(oauthStart) || !/provider:\s*["']google["']/.test(oauthStart)) {
    fail("Auth architecture gate: /auth/google must call signInWithOAuth for Google.");
  }
  if (!/skipBrowserRedirect:\s*true/.test(oauthStart)) {
    fail("Auth architecture gate: server OAuth start must request a URL instead of browser auto-redirect.");
  }
  if (!/\/auth\/callback/.test(oauthStart) || !/NextResponse\.redirect\s*\(/.test(oauthStart)) {
    fail("Auth architecture gate: server OAuth start must redirect through the LandingNL callback.");
  }
  if (!/no-store/i.test(oauthStart)) {
    fail("Auth cache gate: OAuth start responses must be private/no-store.");
  }
}
if (!exists(googleButtonPath)) {
  fail("Auth architecture gate: Google sign-in control is missing.");
} else {
  if (/supabase\/client/.test(googleButton) || /signInWithOAuth\s*\(/.test(googleButton)) {
    fail("Auth architecture gate: login UI must not start OAuth from the browser client.");
  }
  if (!/href=["']\/auth\/google["']/.test(googleButton)) {
    fail("Auth architecture gate: Google sign-in control must navigate to /auth/google.");
  }
}
if (!/exchangeCodeForSession\s*\(/.test(callback)) {
  fail("Auth architecture gate: callback must exchange the PKCE code for a session.");
}
if (!/fallback\s*=\s*["']\/onboarding["']/.test(callback)) {
  fail("Auth UX gate: successful Google callback must default to onboarding.");
}

// Onboarding: profile creation belongs to the auth trigger; browser writes are update-only + RLS.
if (exists("src/app/onboarding/actions.ts")) {
  fail("Onboarding architecture gate: server action persistence must not be reintroduced.");
}
if (/from\s+["']\.\/actions["']/.test(onboarding)) {
  fail("Onboarding architecture gate: page.tsx must not import onboarding server actions.");
}
if (!/from\s+["']@\/lib\/supabase\/client["']/.test(onboarding)) {
  fail("Onboarding architecture gate: onboarding must use the browser Supabase client.");
}
if (/from\(["']profiles["']\)[\s\S]{0,120}\.upsert\s*\(/.test(onboarding)) {
  fail("Authorization gate: onboarding must never upsert/insert profiles from the browser.");
}
if (!/from\(["']profiles["']\)[\s\S]{0,160}\.update\s*\(/.test(onboarding) || !/\.eq\(["']id["']\s*,\s*user\.id\)/.test(onboarding)) {
  fail("Authorization gate: onboarding profile persistence must be an own-id update.");
}
if (!/supabase\.from\(["']housing_profiles["']\)/.test(onboarding)) {
  fail("Onboarding architecture gate: housing persistence must remain explicit and auditable.");
}
if (!/create trigger on_auth_user_created/i.test(authBootstrap) || !/handle_new_user/i.test(authBootstrap)) {
  fail("Auth bootstrap gate: profile creation trigger is missing.");
}

// RLS + authorization hardening.
if (!/alter table public\.profiles enable row level security/i.test(foundation)) {
  fail("RLS gate: profiles must have row level security enabled.");
}
if (!/alter table public\.housing_profiles enable row level security/i.test(foundation)) {
  fail("RLS gate: housing_profiles must have row level security enabled.");
}
if (!/users manage own housing/i.test(foundation) || !/with check\s*\(auth\.uid\(\)\s*=\s*user_id\)/i.test(foundation)) {
  fail("RLS gate: housing_profiles must retain an own-row write policy with check.");
}
if (!exists(authHardeningPath)) {
  fail("Authorization gate: 0012 authorization hardening migration is missing.");
} else {
  if (!/drop policy if exists ["']users insert own profile["']/i.test(authHardening)) {
    fail("Authorization gate: self-service profile insert policy must be removed.");
  }
  if (!/revoke insert, update, delete[\s\S]*on table public\.profiles from authenticated/i.test(authHardening)) {
    fail("Authorization gate: authenticated users must lose table-wide profile mutation privileges.");
  }
  if (!/grant update \(first_name, city, university, citizenship_country, arrival_date, birth_year, updated_at\)/i.test(authHardening)) {
    fail("Authorization gate: profile updates must use an explicit safe column allow-list.");
  }
  if (/grant update \([^)]*membership/i.test(authHardening)) {
    fail("Authorization gate: membership must never be user-updatable.");
  }
  if (!/alter table public\.analytics_events enable row level security/i.test(authHardening) || !/revoke all on table public\.analytics_events from anon, authenticated/i.test(authHardening)) {
    fail("Privacy gate: analytics ingestion must stay closed until consent-bound persistence exists.");
  }
}

// Admin: route must be both authenticated and membership-gated.
if (!/supabase\.auth\.getUser\s*\(/.test(adminRules) || !/membership/.test(adminRules) || !/["']admin["']/.test(adminRules)) {
  fail("Authorization gate: /admin/rules must verify authenticated admin membership server-side.");
}

// Trusted supporter: revoke must survive refresh and bearer snapshots must not be indexed/cached/referrer-leaked.
if (!/getActiveSupporter/.test(supporterActions) || !/getActiveSupporter/.test(supporterPage)) {
  fail("Supporter privacy gate: active supporter state must reload so revoke remains available after refresh.");
}
if (!/robots:\s*\{\s*index:\s*false/i.test(sharePage) || !/referrer:\s*["']no-referrer["']/i.test(sharePage)) {
  fail("Supporter privacy gate: share pages must declare noindex and no-referrer metadata.");
}
if (!/source:\s*["']\/share\/:path\*["']/.test(nextConfig) || !/no-store/i.test(nextConfig) || !/X-Robots-Tag/i.test(nextConfig)) {
  fail("Supporter privacy gate: share responses must be no-store and carry X-Robots-Tag headers.");
}

// Navigation: keep primary mobile navigation intentionally small.
const navItemsBlock = nav.match(/const items = \[([\s\S]*?)\] as const;/)?.[1] ?? "";
const navItemCount = [...navItemsBlock.matchAll(/\[\s*["'][^"']+["']\s*,\s*["'][^"']+["']\s*\]/g)].length;
if (navItemCount !== 5) {
  fail(`Navigation gate: expected exactly 5 primary destinations, found ${navItemCount}.`);
}
if (!/aria-current=/.test(nav)) {
  fail("Accessibility gate: active primary navigation item must expose aria-current.");
}

// Deployment identity: production must expose the exact build commit instead of relying on dashboard guesses.
if (!exists("scripts/write-build-meta.mjs")) {
  fail("Deployment identity gate: build metadata generator is missing.");
}
if (!exists("src/app/api/version/route.ts")) {
  fail("Deployment identity gate: /api/version route is missing.");
}
if (!String(packageJson.scripts?.["build:worker"] ?? "").includes("build:meta")) {
  fail("Deployment identity gate: build:worker must generate build metadata before OpenNext build.");
}

// User-facing production copy must not expose platform internals.
const userFacingFiles = [
  "src/app/page.tsx",
  "src/app/login/page.tsx",
  "src/app/onboarding/page.tsx",
].filter(exists);
const forbiddenCopy = [/Cloudflare runtime/i, /Invalid supabaseUrl/i, /server-side exception/i];
for (const filePath of userFacingFiles) {
  const content = read(filePath);
  for (const pattern of forbiddenCopy) {
    if (pattern.test(content)) fail(`UX copy gate: ${filePath} contains technical user-facing copy matching ${pattern}.`);
  }
}

// Secret boundary: client/application source must never contain service-role credentials or labels.
for (const filePath of walk("src").filter((item) => /\.(ts|tsx|js|jsx)$/.test(item))) {
  if (/service[_-]?role/i.test(read(filePath))) {
    fail(`Secret boundary gate: ${filePath} references a service-role credential.`);
  }
}

if (failures.length) {
  console.error("\nLandingNL permanent quality gates FAILED:\n");
  for (const item of failures) console.error(`- ${item}`);
  console.error("\nFix the root cause; do not bypass this gate.\n");
  process.exit(1);
}

console.log("LandingNL permanent quality gates passed.");
