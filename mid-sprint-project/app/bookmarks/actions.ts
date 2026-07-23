"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createBookmark, deleteBookmark } from "@/app/lib/db";

export async function createBookmarkAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const url = String(formData.get("url") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  if (!url || !title) throw new Error("URL and title are required");

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

  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing bookmark id");

  await deleteBookmark(id);
  revalidatePath("/bookmarks");
}
