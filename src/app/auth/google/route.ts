import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safeInternalPath(value: string | null, fallback = "/onboarding") {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = safeInternalPath(url.searchParams.get("next"));

  try {
    const supabase = await createClient();
    const redirectTo = `${url.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });

    if (error || !data.url) {
      return NextResponse.redirect(new URL("/login?error=oauth_start", url.origin));
    }

    return NextResponse.redirect(data.url);
  } catch {
    return NextResponse.redirect(new URL("/login?error=supabase_config", url.origin));
  }
}
