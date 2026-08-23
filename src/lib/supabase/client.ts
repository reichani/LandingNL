import { createBrowserClient } from "@supabase/ssr";
import {
  assertPublicSupabaseConfig,
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
} from "./public-config";

export function createClient() {
  assertPublicSupabaseConfig();
  return createBrowserClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
}
