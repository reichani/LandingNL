"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const emailSchema = z.string().trim().email().max(254);
const productionOrigin = "https://landingnl.reichani.workers.dev";

export type EmailSignInState = {
  status: "idle" | "success" | "error";
  message?: string;
};

function trustedOrigin(host: string | null) {
  if (host === "localhost:3000" || host === "127.0.0.1:3000") {
    return `http://${host}`;
  }
  return productionOrigin;
}

export async function signInWithEmail(
  _previousState: EmailSignInState,
  formData: FormData,
): Promise<EmailSignInState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { status: "error", message: "Enter a valid email address." };
  }

  try {
    const requestHeaders = await headers();
    const emailRedirectTo = `${trustedOrigin(requestHeaders.get("host"))}/auth/callback`;
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: parsed.data.toLowerCase(),
      options: {
        emailRedirectTo,
        shouldCreateUser: true,
      },
    });

    if (error) {
      console.error("email_sign_in_start_failed", { name: error.name, message: error.message });
      return {
        status: "error",
        message: "We couldn’t send the sign-in link. Please wait a moment and try again.",
      };
    }

    return {
      status: "success",
      message: "Check your inbox. We sent you a secure sign-in link.",
    };
  } catch (startError) {
    console.error("email_sign_in_start_exception", startError);
    return {
      status: "error",
      message: "We couldn’t send the sign-in link. Please try again.",
    };
  }
}
