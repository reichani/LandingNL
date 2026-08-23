import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const redirectTo = new URL("/auth/callback", requestUrl.origin).toString();

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error || !data.url) {
      console.error("google_oauth_server_start_failed", {
        name: error?.name,
        message: error?.message,
      });
      return NextResponse.redirect(new URL("/login?error=oauth_start", requestUrl.origin));
    }

    const response = NextResponse.redirect(data.url, 302);
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("Pragma", "no-cache");
    return response;
  } catch (startError) {
    console.error("google_oauth_server_start_exception", startError);
    return NextResponse.redirect(new URL("/login?error=oauth_start", requestUrl.origin));
  }
}
