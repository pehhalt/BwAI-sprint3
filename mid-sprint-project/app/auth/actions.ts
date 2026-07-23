"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// --- Best-effort in-process rate limiting -----------------------------------
//
// LIMITATION: this state lives in module-level memory inside a single
// serverless function instance. On Vercel, separate invocations can land on
// separate (or freshly cold-started) instances that don't share this Map, and
// any instance can be recycled at any time. This is therefore *best-effort*
// throttling within one warm instance — not a hard, globally-enforced rate
// limit. It raises the bar against naive scripted abuse and complements (does
// not replace) Supabase Auth's own server-side rate limits. A real guarantee
// would need shared external state (e.g. Upstash Redis) or a platform-level
// control (e.g. Vercel Firewall rate-limiting rules).
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute window
const RATE_LIMIT_MAX_ATTEMPTS = 5; // attempts per identifier per window

type RateLimitEntry = { count: number; windowStart: number };
const rateLimitStore = new Map<string, RateLimitEntry>();

function checkRateLimit(key: string): boolean {
  const now = Date.now();

  // Opportunistic cleanup so the map doesn't grow unbounded across the
  // lifetime of a warm instance.
  if (rateLimitStore.size > 500) {
    for (const [k, v] of rateLimitStore) {
      if (now - v.windowStart > RATE_LIMIT_WINDOW_MS) rateLimitStore.delete(k);
    }
  }

  const entry = rateLimitStore.get(key);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    return false;
  }
  entry.count += 1;
  return true;
}

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

  if (!checkRateLimit(`signup:${email.toLowerCase()}`)) {
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

  if (!checkRateLimit(`login:${email.toLowerCase()}`)) {
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
