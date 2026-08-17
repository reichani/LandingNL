import { json } from "./_lib/http.js";

export async function onRequestGet() {
  return json({
    app: "landingnl-v2",
    runtime: "cloudflare-pages-functions",
    deploymentIdentity: "/version.json",
  });
}
