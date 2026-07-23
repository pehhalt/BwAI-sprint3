"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createBookmark, deleteBookmark } from "@/app/lib/db";
import { checkRateLimit } from "@/app/lib/rate-limit";

const BOOKMARK_RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute window
const BOOKMARK_RATE_LIMIT_MAX_ATTEMPTS = 20; // create+delete combined, per user, per window

const MAX_URL_LENGTH = 2048;
const MAX_TITLE_LENGTH = 200;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function createBookmarkAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (
    !checkRateLimit(
      `bookmark:${user.id}`,
      BOOKMARK_RATE_LIMIT_MAX_ATTEMPTS,
      BOOKMARK_RATE_LIMIT_WINDOW_MS
    )
  ) {
    throw new Error("Too many attempts, please try again shortly.");
  }

  const url = String(formData.get("url") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  if (!url || !title) throw new Error("URL and title are required");
  if (url.length > MAX_URL_LENGTH) throw new Error(`URL must be ${MAX_URL_LENGTH} characters or fewer`);
  if (title.length > MAX_TITLE_LENGTH) throw new Error(`Title must be ${MAX_TITLE_LENGTH} characters or fewer`);

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("URL must be a valid absolute URL");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("URL must use http or https");
  }

  await createBookmark(url, title);
  revalidatePath("/bookmarks");
}

export async function deleteBookmarkAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (
    !checkRateLimit(
      `bookmark:${user.id}`,
      BOOKMARK_RATE_LIMIT_MAX_ATTEMPTS,
      BOOKMARK_RATE_LIMIT_WINDOW_MS
    )
  ) {
    throw new Error("Too many attempts, please try again shortly.");
  }

  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing bookmark id");
  if (!UUID_RE.test(id)) throw new Error("Invalid bookmark id");

  await deleteBookmark(id);
  revalidatePath("/bookmarks");
}
