export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extraHeaders,
    },
  });
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function cleanString(value, max = 160) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function oneOf(value, allowed, fallback = null) {
  return allowed.includes(value) ? value : fallback;
}

export function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export function safeInternalPath(value, fallback = "/app") {
  if (!value || typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}
