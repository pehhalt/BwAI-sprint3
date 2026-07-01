import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  // Handle OAuth provider errors - don't expose error description in URL
  // CSRF protection: state parameter is validated by Supabase SDK automatically
  if (error) {
    console.error("OAuth authentication failed");
    redirect("/auth/error?error=authentication_failed");
  }

  // Validate code format before exchanging
  if (!code || typeof code !== "string" || code.length === 0) {
    console.error("Invalid or missing authorization code");
    redirect("/auth/error?error=invalid_code");
  }

  // Exchange code for session
  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error("OAuth code exchange failed");
    redirect("/auth/error?error=authentication_failed");
  }

  // Success — redirect to protected area
  redirect("/protected");
}
