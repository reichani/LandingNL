import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  assertPublicSupabaseConfig,
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
} from "./public-config";

export async function createClient() {
  assertPublicSupabaseConfig();
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot always persist refreshed cookies directly.
          // The root request proxy refreshes auth cookies before render.
        }
      },
    },
  });
}
