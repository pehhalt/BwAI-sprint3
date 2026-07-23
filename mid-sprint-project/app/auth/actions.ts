"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/app/lib/rate-limit";

const AUTH_RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute window
const AUTH_RATE_LIMIT_MAX_ATTEMPTS = 5; // attempts per identifier per window

// Supabase's signup error for an already-registered email is distinguishable
// via error.code ("user_already_exists") or, on older/edge-case responses,
// message text. Detect it so we can respond with a generic message instead
// of confirming account existence to the caller (email enumeration).
function isAlreadyRegisteredError(error: { code?: string; message: string }): boolean {
  return (
    error.code === "user_already_exists" ||
    /already registered/i.test(error.message)
  );
}

export async function signUpAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (
    !checkRateLimit(
      `signup:${email.toLowerCase()}`,
      AUTH_RATE_LIMIT_MAX_ATTEMPTS,
      AUTH_RATE_LIMIT_WINDOW_MS
    )
  ) {
    throw new Error("Too many attempts, please try again shortly.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) {
    if (isAlreadyRegisteredError(error)) {
      throw new Error(
        "Unable to sign up with these details — please check your information and try again, or log in if you already have an account."
      );
    }
    throw new Error(error.message);
  }
  redirect("/bookmarks");
}

export async function logInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (
    !checkRateLimit(
      `login:${email.toLowerCase()}`,
      AUTH_RATE_LIMIT_MAX_ATTEMPTS,
      AUTH_RATE_LIMIT_WINDOW_MS
    )
  ) {
    throw new Error("Too many attempts, please try again shortly.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  redirect("/bookmarks");
}

export async function logOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
