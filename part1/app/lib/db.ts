import { SupabaseClient } from "@supabase/supabase-js";

export type Note = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
  collection_id: string | null;
};

export type Collection = {
  id: string;
  name: string;
  created_at: string;
};

export type Tag = {
  id: string;
  name: string;
};

// ── Validation ────────────────────────────────────────────────────────────────

const LIMITS = {
  noteTitle: 200,
  noteBody: 100_000,
  collectionName: 100,
  tagName: 50,
  searchQuery: 200,
} as const;

function assertLength(value: string, field: string, max: number) {
  if (value.length > max)
    throw new Error(`${field} must be ${max} characters or fewer.`);
}

function assertNonEmpty(value: string, field: string) {
  if (!value.trim()) throw new Error(`${field} must not be empty.`);
}

// Postgres unique_violation. Used to detect a find-or-create race on tag
// names (two concurrent inserts for the same tag) so the caller can recover
// by looking up the tag the other request just created, instead of failing.
export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === "23505"
  );
}

// ── Notes ─────────────────────────────────────────────────────────────────────

export async function getNotes(supabase: SupabaseClient): Promise<Note[]> {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function searchNotes(
  supabase: SupabaseClient,
  query: string
): Promise<Note[]> {
  assertNonEmpty(query, "Search query");
  assertLength(query, "Search query", LIMITS.searchQuery);
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .textSearch("fts", query, { type: "websearch", config: "english" })
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createNote(
  supabase: SupabaseClient,
  title: string,
  body: string,
  collection_id?: string | null
): Promise<Note> {
  assertLength(title, "Title", LIMITS.noteTitle);
  assertLength(body, "Body", LIMITS.noteBody);
  const { data, error } = await supabase
    .from("notes")
    .insert({ title, body, collection_id: collection_id ?? null })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateNote(
  supabase: SupabaseClient,
  id: string,
  fields: Partial<Pick<Note, "title" | "body" | "collection_id">>
): Promise<Note> {
  if (fields.title !== undefined)
    assertLength(fields.title, "Title", LIMITS.noteTitle);
  if (fields.body !== undefined)
    assertLength(fields.body, "Body", LIMITS.noteBody);
  const { data, error } = await supabase
    .from("notes")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteNote(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) throw error;
}

// ── Collections ───────────────────────────────────────────────────────────────

export async function getCollections(
  supabase: SupabaseClient
): Promise<Collection[]> {
  const { data, error } = await supabase
    .from("collections")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createCollection(
  supabase: SupabaseClient,
  name: string
): Promise<Collection> {
  assertNonEmpty(name, "Collection name");
  assertLength(name, "Collection name", LIMITS.collectionName);
  const { data, error } = await supabase
    .from("collections")
    .insert({ name: name.trim() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function renameCollection(
  supabase: SupabaseClient,
  id: string,
  name: string
): Promise<Collection> {
  const { data, error } = await supabase
    .from("collections")
    .update({ name })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Tags ──────────────────────────────────────────────────────────────────────

export async function getTags(supabase: SupabaseClient): Promise<Tag[]> {
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// Returns a flat list of { note_id, tag } rows for all notes.
// Uses two separate queries instead of a join to avoid RLS filtering
// silently nulling out joined rows.
export async function getNoteTags(
  supabase: SupabaseClient
): Promise<{ note_id: string; tag: Tag }[]> {
  const [noteTagsRes, tagsRes] = await Promise.all([
    supabase.from("note_tags").select("note_id, tag_id"),
    supabase.from("tags").select("id, name"),
  ]);
  if (noteTagsRes.error) throw noteTagsRes.error;
  if (tagsRes.error) throw tagsRes.error;

  const tagsById = new Map((tagsRes.data ?? []).map((t) => [t.id, t as Tag]));

  return (noteTagsRes.data ?? [])
    .map((row) => {
      const tag = tagsById.get(row.tag_id);
      return tag ? { note_id: row.note_id, tag } : null;
    })
    .filter(Boolean) as { note_id: string; tag: Tag }[];
}

export async function createTag(
  supabase: SupabaseClient,
  name: string
): Promise<Tag> {
  assertNonEmpty(name, "Tag name");
  assertLength(name, "Tag name", LIMITS.tagName);
  const { data, error } = await supabase
    .from("tags")
    .insert({ name: name.trim() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function findTagByName(
  supabase: SupabaseClient,
  name: string
): Promise<Tag | null> {
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .eq("name", name.trim())
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function addTagToNote(
  supabase: SupabaseClient,
  noteId: string,
  tagId: string
): Promise<void> {
  const { error } = await supabase
    .from("note_tags")
    .insert({ note_id: noteId, tag_id: tagId });
  if (error) throw error;
}

export async function removeTagFromNote(
  supabase: SupabaseClient,
  noteId: string,
  tagId: string
): Promise<void> {
  const { error } = await supabase
    .from("note_tags")
    .delete()
    .eq("note_id", noteId)
    .eq("tag_id", tagId);
  if (error) throw error;
}
