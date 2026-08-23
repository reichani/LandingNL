import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  assertPublicSupabaseConfig,
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
} from "./public-config";

export async function updateSession(request: NextRequest) {
  assertPublicSupabaseConfig();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Refresh/validate the token before Server Components read it. Authorization
  // still happens in RLS and on genuinely private server routes; guest Plan,
  // Money, Wallet and Work guidance remain browsable.
  await supabase.auth.getClaims();

  return response;
}
