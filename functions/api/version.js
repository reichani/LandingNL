import { json } from "./_lib/http.js";

export async function onRequestGet({ env }) {
  return json({
    app: "landingnl-v2",
    commit: env.CF_PAGES_COMMIT_SHA || "local",
    branch: env.CF_PAGES_BRANCH || "local",
  });
}
