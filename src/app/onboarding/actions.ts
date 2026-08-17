"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const onboardingSchema = z.object({
  city: z.string().trim().min(2).max(80),
  university: z.string().trim().min(2).max(160),
  citizenship: z.string().trim().min(2).max(80),
  arrivalDate: z.string().date(),
  housing: z.enum(["secured", "searching"]),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type OnboardingResult =
  | { ok: true }
  | { ok: false; error: string; code: "validation" | "auth" | "profile" | "housing" | "unexpected" };

export async function saveOnboarding(input: OnboardingInput): Promise<OnboardingResult> {
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "validation", error: "Check this answer and try again." };
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, code: "auth", error: "Your sign-in expired. Please sign in again to save your plan." };
    }

    const { city, university, citizenship, arrivalDate, housing } = parsed.data;
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.id,
      city,
      university,
      citizenship_country: citizenship,
      arrival_date: arrivalDate,
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      console.error("onboarding_profile_save_failed", { code: profileError.code, message: profileError.message });
      return { ok: false, code: "profile", error: "We couldn’t save your setup yet. Your answers are still here — please try again." };
    }

    const { error: housingError } = await supabase.from("housing_profiles").upsert({
      user_id: user.id,
      housing_status: housing,
      updated_at: new Date().toISOString(),
    });

    if (housingError) {
      console.error("onboarding_housing_save_failed", { code: housingError.code, message: housingError.message });
      return { ok: false, code: "housing", error: "Your profile was saved, but housing status needs another try." };
    }

    // Navigation happens in the browser after the action resolves successfully.
    // This avoids coupling persistence to framework redirect exceptions at the Worker boundary.
    return { ok: true };
  } catch (error) {
    console.error("onboarding_unexpected_failure", error);
    return { ok: false, code: "unexpected", error: "Something interrupted the save. Your answers are still here — please try again." };
  }
}
