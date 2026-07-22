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

const NOTE_COLUMNS = "id, title, body, created_at, updated_at, collection_id";
const COLLECTION_COLUMNS = "id, name, created_at";
const TAG_COLUMNS = "id, name";

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

// ── Authorization ─────────────────────────────────────────────────────────────
//
// RLS is the enforced boundary, but every mutation here also scopes its query
// to the caller's own user_id explicitly. This is defense-in-depth: a future
// RLS regression (a dropped policy, a migration mistake, a privileged query
// added elsewhere) shouldn't silently turn into cross-user read/write with no
// second line of defense in application code.

async function requireUserId(supabase: SupabaseClient): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Not authenticated.");
  return data.user.id;
}

async function assertOwnsCollection(
  supabase: SupabaseClient,
  userId: string,
  collectionId: string
) {
  const { data, error } = await supabase
    .from("collections")
    .select("id")
    .eq("id", collectionId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Collection not found.");
}

async function assertOwnsNoteAndTag(
  supabase: SupabaseClient,
  userId: string,
  noteId: string,
  tagId: string
) {
  const [noteRes, tagRes] = await Promise.all([
    supabase.from("notes").select("id").eq("id", noteId).eq("user_id", userId).maybeSingle(),
    supabase.from("tags").select("id").eq("id", tagId).eq("user_id", userId).maybeSingle(),
  ]);
  if (noteRes.error) throw noteRes.error;
  if (tagRes.error) throw tagRes.error;
  if (!noteRes.data) throw new Error("Note not found.");
  if (!tagRes.data) throw new Error("Tag not found.");
}

// ── Notes ─────────────────────────────────────────────────────────────────────

export async function getNotes(supabase: SupabaseClient): Promise<Note[]> {
  const userId = await requireUserId(supabase);
  const { data, error } = await supabase
    .from("notes")
    .select(NOTE_COLUMNS)
    .eq("user_id", userId)
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
  const userId = await requireUserId(supabase);
  const { data, error } = await supabase
    .from("notes")
    .select(NOTE_COLUMNS)
    .eq("user_id", userId)
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
  const userId = await requireUserId(supabase);
  if (collection_id) await assertOwnsCollection(supabase, userId, collection_id);
  const { data, error } = await supabase
    .from("notes")
    .insert({ title, body, collection_id: collection_id ?? null })
    .select(NOTE_COLUMNS)
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
  const userId = await requireUserId(supabase);
  if (fields.collection_id)
    await assertOwnsCollection(supabase, userId, fields.collection_id);
  const { data, error } = await supabase
    .from("notes")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select(NOTE_COLUMNS)
    .single();
  if (error) throw error;
  return data;
}

export async function deleteNote(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const userId = await requireUserId(supabase);
  const { error } = await supabase
    .from("notes")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

// ── Collections ───────────────────────────────────────────────────────────────

export async function getCollections(
  supabase: SupabaseClient
): Promise<Collection[]> {
  const userId = await requireUserId(supabase);
  const { data, error } = await supabase
    .from("collections")
    .select(COLLECTION_COLUMNS)
    .eq("user_id", userId)
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
    .select(COLLECTION_COLUMNS)
    .single();
  if (error) throw error;
  return data;
}

export async function renameCollection(
  supabase: SupabaseClient,
  id: string,
  name: string
): Promise<Collection> {
  const userId = await requireUserId(supabase);
  const { data, error } = await supabase
    .from("collections")
    .update({ name })
    .eq("id", id)
    .eq("user_id", userId)
    .select(COLLECTION_COLUMNS)
    .single();
  if (error) throw error;
  return data;
}

// ── Tags ──────────────────────────────────────────────────────────────────────

export async function getTags(supabase: SupabaseClient): Promise<Tag[]> {
  const userId = await requireUserId(supabase);
  const { data, error } = await supabase
    .from("tags")
    .select(TAG_COLUMNS)
    .eq("user_id", userId)
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// Returns a flat list of { note_id, tag } rows for all of the caller's notes.
// Uses two separate queries instead of a join to avoid RLS filtering
// silently nulling out joined rows.
export async function getNoteTags(
  supabase: SupabaseClient
): Promise<{ note_id: string; tag: Tag }[]> {
  const userId = await requireUserId(supabase);
  const [noteTagsRes, tagsRes] = await Promise.all([
    supabase.from("note_tags").select("note_id, tag_id"),
    supabase.from("tags").select(TAG_COLUMNS).eq("user_id", userId),
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
    .select(TAG_COLUMNS)
    .single();
  if (error) throw error;
  return data;
}

export async function findTagByName(
  supabase: SupabaseClient,
  name: string
): Promise<Tag | null> {
  const userId = await requireUserId(supabase);
  const { data, error } = await supabase
    .from("tags")
    .select(TAG_COLUMNS)
    .eq("user_id", userId)
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
  const userId = await requireUserId(supabase);
  await assertOwnsNoteAndTag(supabase, userId, noteId, tagId);
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
  const userId = await requireUserId(supabase);
  await assertOwnsNoteAndTag(supabase, userId, noteId, tagId);
  const { error } = await supabase
    .from("note_tags")
    .delete()
    .eq("note_id", noteId)
    .eq("tag_id", tagId);
  if (error) throw error;
}
