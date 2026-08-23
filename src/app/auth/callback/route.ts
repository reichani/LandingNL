import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safeInternalPath(value: string | null, fallback = "/onboarding") {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeInternalPath(url.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", url.origin));
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("auth_code_exchange_failed", {
        name: error.name,
        message: error.message,
      });
      return NextResponse.redirect(new URL("/login?error=oauth_callback", url.origin));
    }

    return NextResponse.redirect(new URL(next, url.origin));
  } catch (callbackError) {
    console.error("auth_callback_failed", callbackError);
    return NextResponse.redirect(new URL("/login?error=oauth_callback", url.origin));
  }
}
