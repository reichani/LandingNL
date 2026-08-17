import fs from "node:fs";

const failures = [];
const read = (path) => fs.readFileSync(path, "utf8");
const exists = (path) => fs.existsSync(path);

function fail(message) {
  failures.push(message);
}

const css = read("src/app/globals.css");
const onboarding = read("src/app/onboarding/page.tsx");
const nav = read("src/components/PrimaryNav.tsx");

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

// Navigation: keep primary mobile navigation intentionally small.
const navItemsBlock = nav.match(/const items = \[([\s\S]*?)\] as const;/)?.[1] ?? "";
const navItemCount = [...navItemsBlock.matchAll(/\[\s*["'][^"']+["']\s*,\s*["'][^"']+["']\s*\]/g)].length;
if (navItemCount !== 5) {
  fail(`Navigation gate: expected exactly 5 primary destinations, found ${navItemCount}.`);
}
if (!/aria-current=/.test(nav)) {
  fail("Accessibility gate: active primary navigation item must expose aria-current.");
}

// User-facing production copy must not expose platform internals.
const userFacingFiles = [
  "src/app/page.tsx",
  "src/app/login/page.tsx",
  "src/app/onboarding/page.tsx",
].filter(exists);
const forbiddenCopy = [/Cloudflare runtime/i, /Invalid supabaseUrl/i, /server-side exception/i];
for (const path of userFacingFiles) {
  const content = read(path);
  for (const pattern of forbiddenCopy) {
    if (pattern.test(content)) fail(`UX copy gate: ${path} contains technical user-facing copy matching ${pattern}.`);
  }
}

if (failures.length) {
  console.error("\nLandingNL permanent quality gates FAILED:\n");
  for (const item of failures) console.error(`- ${item}`);
  console.error("\nFix the root cause; do not bypass this gate.\n");
  process.exit(1);
}

console.log("LandingNL permanent quality gates passed.");
