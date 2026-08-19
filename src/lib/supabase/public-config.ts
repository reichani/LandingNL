// Supabase project coordinates intentionally live in application source.
// Both values are public browser credentials: the publishable key is not a secret
// and authorization is enforced by Supabase Auth + Row Level Security.
// Keeping them canonical here removes Cloudflare build/runtime env drift from the
// authentication critical path. Never add a privileged secret key here.
export const SUPABASE_URL = "https://iwzsewwnntfylryqaihu.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_l461HYfQDcU2_FIw3pzZFw_Lyf3mcmX";

export function assertPublicSupabaseConfig() {
  const parsed = new URL(SUPABASE_URL);
  if (parsed.protocol !== "https:" || parsed.hostname !== "iwzsewwnntfylryqaihu.supabase.co") {
    throw new Error("LandingNL Supabase project URL is invalid.");
  }
  if (!SUPABASE_PUBLISHABLE_KEY.startsWith("sb_publishable_")) {
    throw new Error("LandingNL Supabase publishable key is invalid.");
  }
}
