import fs from "node:fs";
import path from "node:path";

const failures = [];
const read = (file) => fs.readFileSync(file, "utf8");
const exists = (file) => fs.existsSync(file);
const fail = (message) => failures.push(message);

const packageJson = JSON.parse(read("package.json"));
const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
for (const forbidden of ["next", "@opennextjs/cloudflare", "@supabase/supabase-js", "@supabase/ssr"]) {
  if (deps[forbidden]) fail(`Architecture gate: active v2 package must not depend on ${forbidden}.`);
}

if (!exists("v2/src/App.tsx")) fail("UX gate: v2/src/App.tsx is missing.");
if (!exists("v2/src/styles.css")) fail("UX gate: v2 styles are missing.");
if (!exists("d1/migrations/0001_v2_core.sql")) fail("Data gate: canonical D1 v2 schema is missing.");
if (!exists("functions/api/auth/google.js") || !exists("functions/api/auth/callback.js")) fail("Auth gate: direct Google OAuth endpoints are missing.");
if (!exists("scripts/write-v2-version.mjs")) fail("Deployment identity gate: build-time version generator is missing.");
if (!String(packageJson.scripts?.build || "").includes("write-v2-version.mjs")) fail("Deployment identity gate: build must generate version.json before Vite build.");

const app = exists("v2/src/App.tsx") ? read("v2/src/App.tsx") : "";
const css = exists("v2/src/styles.css") ? read("v2/src/styles.css") : "";
const runtime = ["v2", "functions"].flatMap((root) => {
  if (!exists(root)) return [];
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
  return walk(root).filter((file) => /\.(ts|tsx|js|jsx|css)$/.test(file));
});

for (const file of runtime) {
  const content = read(file);
  if (/supabase/i.test(content)) fail(`Architecture gate: ${file} still references Supabase.`);
  if (/opennext/i.test(content)) fail(`Architecture gate: ${file} still references OpenNext.`);
  if (/service[_-]?role/i.test(content)) fail(`Secret gate: ${file} references a service-role credential.`);
  if (/\b(?:exact_address|street_address|bsn_number|passport_number)\b/i.test(content)) fail(`Privacy gate: ${file} introduces a forbidden sensitive field.`);
}

if (/\brotate\s*\(/i.test(css) || /\bskew(?:X|Y)?\s*\(/i.test(css)) fail("UX geometry gate: product UI must not rotate or skew persistent surfaces.");
if (!/const PRIMARY_NAV = \["Home", "Plan", "Money", "Work", "Circle"\] as const;/.test(app)) fail("Navigation gate: v2 primary navigation must be Home · Plan · Money · Work · Circle.");
if (!/const ONBOARDING_STEPS = 3;/.test(app)) fail("Onboarding gate: v2 onboarding must remain three screens.");
if (!/NOW/.test(app) || !/THIS WEEK/.test(app)) fail("Home gate: authenticated Home must preserve NOW + THIS WEEK hierarchy.");

const callback = exists("functions/api/auth/callback.js") ? read("functions/api/auth/callback.js") : "";
if (!/openidconnect\.googleapis\.com\/v1\/userinfo/.test(callback)) fail("Auth gate: callback must resolve identity from Google's UserInfo endpoint.");
if (/jwtClaims|id_token.*split/i.test(callback)) fail("Auth gate: v2 must not hand-parse Google ID tokens.");

for (const route of [
  "functions/api/me.js",
  "functions/api/onboarding.js",
  "functions/api/milestones.js",
  "functions/api/money.js",
  "functions/api/work/applications.js",
  "functions/api/work/evidence.js",
  "functions/api/circle/posts.js",
]) {
  if (!exists(route)) {
    fail(`API gate: required user-owned route missing: ${route}`);
    continue;
  }
  const content = read(route);
  if (!/requireSession/.test(content) || !/session\.uid/.test(content)) fail(`Isolation gate: ${route} must authenticate and scope by session.uid.`);
}

if (failures.length) {
  console.error("\nLandingNL v2 permanent gates FAILED:\n");
  for (const item of failures) console.error(`- ${item}`);
  console.error("\nFix the root cause; do not bypass the gate.\n");
  process.exit(1);
}

console.log("LandingNL v2 permanent architecture, privacy and UX gates passed.");
