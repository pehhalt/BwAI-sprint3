import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

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
// This module only ever runs on the server ("server-only" above enforces
// this at build time — importing it from a "use client" file is now a
// build error). Every query and mutation below scopes itself explicitly
// to the caller's own user_id, verified via a fresh auth check on a
// server-side Supabase client. Because this code cannot execute in the
// browser, these checks are a genuine second line of defense on top of
// Postgres RLS: a future RLS regression (a dropped policy, a migration
// mistake, a privileged query added elsewhere) would still be caught here.

const getCurrentUserId = cache(async (): Promise<string> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Not authenticated.");
  return data.user.id;
});

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

export async function getNotes(): Promise<Note[]> {
  const supabase = await createClient();
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("notes")
    .select(NOTE_COLUMNS)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function searchNotes(query: string): Promise<Note[]> {
  assertNonEmpty(query, "Search query");
  assertLength(query, "Search query", LIMITS.searchQuery);
  const supabase = await createClient();
  const userId = await getCurrentUserId();
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
  title: string,
  body: string,
  collection_id?: string | null
): Promise<Note> {
  assertLength(title, "Title", LIMITS.noteTitle);
  assertLength(body, "Body", LIMITS.noteBody);
  const supabase = await createClient();
  const userId = await getCurrentUserId();
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
  id: string,
  fields: Partial<Pick<Note, "title" | "body" | "collection_id">>
): Promise<Note> {
  if (fields.title !== undefined)
    assertLength(fields.title, "Title", LIMITS.noteTitle);
  if (fields.body !== undefined)
    assertLength(fields.body, "Body", LIMITS.noteBody);
  const supabase = await createClient();
  const userId = await getCurrentUserId();
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

export async function deleteNote(id: string): Promise<void> {
  const supabase = await createClient();
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from("notes")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

// ── Collections ───────────────────────────────────────────────────────────────

export async function getCollections(): Promise<Collection[]> {
  const supabase = await createClient();
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("collections")
    .select(COLLECTION_COLUMNS)
    .eq("user_id", userId)
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createCollection(name: string): Promise<Collection> {
  assertNonEmpty(name, "Collection name");
  assertLength(name, "Collection name", LIMITS.collectionName);
  const supabase = await createClient();
  await getCurrentUserId();
  const { data, error } = await supabase
    .from("collections")
    .insert({ name: name.trim() })
    .select(COLLECTION_COLUMNS)
    .single();
  if (error) throw error;
  return data;
}

export async function renameCollection(id: string, name: string): Promise<Collection> {
  const supabase = await createClient();
  const userId = await getCurrentUserId();
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

export async function getTags(): Promise<Tag[]> {
  const supabase = await createClient();
  const userId = await getCurrentUserId();
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
export async function getNoteTags(): Promise<{ note_id: string; tag: Tag }[]> {
  const supabase = await createClient();
  const userId = await getCurrentUserId();
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

export async function createTag(name: string): Promise<Tag> {
  assertNonEmpty(name, "Tag name");
  assertLength(name, "Tag name", LIMITS.tagName);
  const supabase = await createClient();
  await getCurrentUserId();
  const { data, error } = await supabase
    .from("tags")
    .insert({ name: name.trim() })
    .select(TAG_COLUMNS)
    .single();
  if (error) throw error;
  return data;
}

export async function findTagByName(name: string): Promise<Tag | null> {
  const supabase = await createClient();
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("tags")
    .select(TAG_COLUMNS)
    .eq("user_id", userId)
    .eq("name", name.trim())
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function addTagToNote(noteId: string, tagId: string): Promise<void> {
  const supabase = await createClient();
  const userId = await getCurrentUserId();
  await assertOwnsNoteAndTag(supabase, userId, noteId, tagId);
  const { error } = await supabase
    .from("note_tags")
    .insert({ note_id: noteId, tag_id: tagId });
  if (error) throw error;
}

// Finds an existing tag by name or creates it, then links it to the given
// note — all server-side in one call. Replaces what used to be up to 3
// sequential client round trips (check local state, maybe createTag, maybe
// findTagByName on a race, addTagToNote) with 1 client→server round trip.
export async function addTagToNoteByName(noteId: string, name: string): Promise<Tag> {
  assertNonEmpty(name, "Tag name");
  const trimmed = name.trim();
  let tag: Tag;
  try {
    tag = await createTag(trimmed);
  } catch (e) {
    if (!isUniqueViolation(e)) throw e;
    const existing = await findTagByName(trimmed);
    if (!existing) throw e;
    tag = existing;
  }
  await addTagToNote(noteId, tag.id);
  return tag;
}

export async function removeTagFromNote(noteId: string, tagId: string): Promise<void> {
  const supabase = await createClient();
  const userId = await getCurrentUserId();
  await assertOwnsNoteAndTag(supabase, userId, noteId, tagId);
  const { error } = await supabase
    .from("note_tags")
    .delete()
    .eq("note_id", noteId)
    .eq("tag_id", tagId);
  if (error) throw error;
}
