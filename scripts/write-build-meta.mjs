import fs from "node:fs";
import { execFileSync } from "node:child_process";

function gitHead() {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

const commit = process.env.CF_PAGES_COMMIT_SHA || process.env.GITHUB_SHA || gitHead();
const builtAt = new Date().toISOString();

fs.mkdirSync("src/generated", { recursive: true });
fs.writeFileSync(
  "src/generated/build-meta.ts",
  `// Generated at build time. Do not edit manually.\nexport const BUILD_COMMIT = ${JSON.stringify(commit)} as const;\nexport const BUILD_TIME = ${JSON.stringify(builtAt)} as const;\n`,
  "utf8",
);

console.log(`Build metadata: ${commit} @ ${builtAt}`);
