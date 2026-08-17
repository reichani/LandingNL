import fs from "node:fs";

const commit = process.env.CF_PAGES_COMMIT_SHA || process.env.GITHUB_SHA || "local";
const branch = process.env.CF_PAGES_BRANCH || process.env.GITHUB_REF_NAME || "local";
const payload = {
  app: "landingnl-v2",
  commit,
  branch,
  builtAt: new Date().toISOString(),
};

fs.mkdirSync("v2/public", { recursive: true });
fs.writeFileSync("v2/public/version.json", `${JSON.stringify(payload, null, 2)}\n`);
console.log(`LandingNL v2 build identity: ${commit} (${branch})`);
