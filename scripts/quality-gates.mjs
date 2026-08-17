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
const nav = read("src/components/PrimaryNav.tsx");
const foundation = read("supabase/migrations/0001_foundation.sql");
const authBootstrap = read("supabase/migrations/0002_auth_profile_bootstrap.sql");
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

// Onboarding: persistence must stay on the browser Supabase client + RLS path.
if (exists("src/app/onboarding/actions.ts")) {
  fail("Onboarding architecture gate: server action persistence must not be reintroduced.");
}
if (/from\s+["']\.\/actions["']/.test(onboarding)) {
  fail("Onboarding architecture gate: page.tsx must not import onboarding server actions.");
}
if (!/from\s+["']@\/lib\/supabase\/client["']/.test(onboarding)) {
  fail("Onboarding architecture gate: onboarding must use the browser Supabase client.");
}
if (!/supabase\.from\(["']profiles["']\)/.test(onboarding) || !/supabase\.from\(["']housing_profiles["']\)/.test(onboarding)) {
  fail("Onboarding architecture gate: profile and housing persistence must remain explicit and auditable.");
}

// RLS: the browser onboarding architecture is only valid while own-row policies remain explicit.
if (!/alter table public\.profiles enable row level security/i.test(foundation)) {
  fail("RLS gate: profiles must have row level security enabled.");
}
if (!/alter table public\.housing_profiles enable row level security/i.test(foundation)) {
  fail("RLS gate: housing_profiles must have row level security enabled.");
}
if (!/users update own profile/i.test(foundation) || !/auth\.uid\(\)\s*=\s*id/i.test(foundation)) {
  fail("RLS gate: profiles must retain an own-row update policy.");
}
if (!/users insert own profile/i.test(authBootstrap) || !/auth\.uid\(\)\s*=\s*id/i.test(authBootstrap)) {
  fail("RLS gate: profiles must retain an own-row insert policy.");
}
if (!/users manage own housing/i.test(foundation) || !/with check\s*\(auth\.uid\(\)\s*=\s*user_id\)/i.test(foundation)) {
  fail("RLS gate: housing_profiles must retain an own-row write policy with check.");
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
