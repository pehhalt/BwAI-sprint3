import "server-only";
import { createClient } from "@/lib/supabase/server";

export type Bookmark = {
  id: string;
  url: string;
  title: string;
  created_at: string;
};

export async function listBookmarks(): Promise<Bookmark[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("bookmarks")
    .select("id, url, title, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createBookmark(url: string, title: string): Promise<Bookmark> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("bookmarks")
    .insert({ url, title, user_id: user.id })
    .select("id, url, title, created_at")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteBookmark(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw error;
}
