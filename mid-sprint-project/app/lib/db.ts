import { createClient } from "@/lib/supabase/server";

export type Bookmark = {
  id: string;
  url: string;
  title: string;
  created_at: string;
};

export async function listBookmarks(): Promise<Bookmark[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookmarks")
    .select("id, url, title, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createBookmark(url: string, title: string): Promise<Bookmark> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookmarks")
    .insert({ url, title })
    .select("id, url, title, created_at")
    .single();
  if (error) throw error;
  return data;
}
