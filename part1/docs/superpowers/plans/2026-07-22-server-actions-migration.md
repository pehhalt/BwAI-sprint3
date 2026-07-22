# Server Actions Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move all notes/collections/tags data access in the `part1/` notes app from direct browser→Supabase calls into genuine Next.js Server Actions, so ownership checks execute server-side (unforgeable by the client) instead of in browser-shipped code.

**Architecture:** `app/lib/db.ts` becomes a `server-only` Data Access Layer (auth, ownership checks, validation, minimal-column selects). Three new `"use server"` files (`app/actions/notes.ts`, `app/actions/collections.ts`, `app/actions/tags.ts`) provide thin action wrappers around the DAL. All Server Components and client hooks call the actions instead of the DAL directly.

**Tech Stack:** Next.js 16 (App Router, Server Actions), React 19 (`cache()`), Supabase (`@supabase/ssr`, `@supabase/supabase-js`), TypeScript. No test framework exists in this project — verification is `tsc --noEmit`, `eslint`, and manual browser smoke testing.

## Global Constraints

- This project has **no automated test suite** — every task's "test" step is a type-check (`npx tsc --noEmit` from `part1/`) and a targeted `npx eslint <file>` on the changed file(s), not `pytest`/`jest`.
- All commands in this plan run from `C:\Projects\TuringCollege\BwAI\sprint3\part1` unless stated otherwise. All git commands run from the repo root, `C:\Projects\TuringCollege\BwAI\sprint3`.
- Preserve existing UX exactly: 800ms debounced autosave, 300ms debounced search, optimistic local-state updates on every mutation.
- Do not touch the browser Supabase client (`lib/supabase/client.ts`) or any of its other call sites (login-form, sign-up-form, logout-button, auth-button, forgot/update-password-form) — those are out of scope.
- Tasks 2–8 form one atomic migration: because `db.ts`'s function signatures change (the `supabase` parameter is removed from every function), the project will **not** type-check cleanly until all of Tasks 2–8 are complete. Do not commit between Task 2 and Task 8 — commit once, at the end of Task 8. Task 1 (bundled small fixes) is independent and commits on its own.

---

### Task 1: Bundled small fixes (encodeURIComponent + eslint-config-next pin)

Two unrelated, independent fixes from the same audit round. Safe to commit immediately.

**Files:**
- Modify: `part1/app/auth/confirm/route.ts:26`
- Modify: `part1/package.json:32`

**Interfaces:** None — no new exports, no callers affected.

- [ ] **Step 1: Fix the unencoded error message in the redirect URL**

In `part1/app/auth/confirm/route.ts`, change line 26 from:

```ts
      redirect(`/auth/error?error=${error?.message}`);
```

to:

```ts
      redirect(`/auth/error?error=${encodeURIComponent(error?.message ?? "Unknown error")}`);
```

- [ ] **Step 2: Bump the stale eslint-config-next pin**

In `part1/package.json`, change line 32 from:

```json
    "eslint-config-next": "15.3.1",
```

to:

```json
    "eslint-config-next": "16.2.9",
```

(This matches the installed `next` version exactly — `eslint-config-next` ships in lockstep with `next` and should be pinned exactly, not with a caret, same convention as the existing line.)

- [ ] **Step 3: Install and verify**

Run (from `part1/`):
```
npm install
```
Expected: lockfile updates only `eslint-config-next` and its own transitive deps — no unrelated version changes. Confirm with:
```
git diff --stat package.json package-lock.json
```

- [ ] **Step 4: Type-check and lint the changed file**

Run:
```
npx tsc --noEmit
```
Expected: no errors (this task doesn't touch any function signatures).

```
npx eslint app/auth/confirm/route.ts
```
Expected: no errors.

- [ ] **Step 5: Commit**

From the repo root (`C:\Projects\TuringCollege\BwAI\sprint3`):
```bash
git add part1/app/auth/confirm/route.ts part1/package.json part1/package-lock.json
git commit -m "$(cat <<'EOF'
Encode error message in auth redirect URL, bump eslint-config-next pin

nextjs-security-scanner flagged both: error.message was interpolated
unencoded into a redirect URL (low risk, but corrupts the query string
on special characters), and eslint-config-next was pinned to a stale
15.3.1 while the app runs Next.js 16.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Server-only DAL + Server Action layer

Rewrites `app/lib/db.ts` to be `server-only` (no `SupabaseClient` parameter on any exported function; each function creates its own server-side client and does its own auth check). Adds three new `"use server"` files that thinly delegate to it.

**Files:**
- Modify: `part1/app/lib/db.ts` (full rewrite)
- Create: `part1/app/actions/notes.ts`
- Create: `part1/app/actions/collections.ts`
- Create: `part1/app/actions/tags.ts`

**Interfaces:**
- Consumes: `createClient()` from `@/lib/supabase/server` (already exists, async, returns a server-side `SupabaseClient` using request cookies).
- Produces (for Tasks 3–8 to call):
  - From `@/app/actions/notes`: `getNotesAction(): Promise<Note[]>`, `searchNotesAction(query: string): Promise<Note[]>`, `createNoteAction(title: string, body: string, collectionId?: string | null): Promise<Note>`, `updateNoteAction(id: string, fields: Partial<Pick<Note, "title" | "body" | "collection_id">>): Promise<Note>`, `deleteNoteAction(id: string): Promise<void>`
  - From `@/app/actions/collections`: `getCollectionsAction(): Promise<Collection[]>`, `createCollectionAction(name: string): Promise<Collection>`, `renameCollectionAction(id: string, name: string): Promise<Collection>`
  - From `@/app/actions/tags`: `getTagsAction(): Promise<Tag[]>`, `getNoteTagsAction(): Promise<{ note_id: string; tag: Tag }[]>`, `addTagToNoteByNameAction(noteId: string, name: string): Promise<Tag>`, `removeTagFromNoteAction(noteId: string, tagId: string): Promise<void>`
  - Types `Note`, `Collection`, `Tag` still exported from `@/app/lib/db`, unchanged shape.

- [ ] **Step 1: Rewrite `app/lib/db.ts`**

Replace the entire contents of `part1/app/lib/db.ts` with:

```ts
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

const getCurrentUserId = cache(async (supabase: SupabaseClient): Promise<string> => {
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
  const userId = await getCurrentUserId(supabase);
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
  const userId = await getCurrentUserId(supabase);
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
  const userId = await getCurrentUserId(supabase);
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
  const userId = await getCurrentUserId(supabase);
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
  const userId = await getCurrentUserId(supabase);
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
  const userId = await getCurrentUserId(supabase);
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
  await getCurrentUserId(supabase);
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
  const userId = await getCurrentUserId(supabase);
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
  const userId = await getCurrentUserId(supabase);
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
  const userId = await getCurrentUserId(supabase);
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
  await getCurrentUserId(supabase);
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
  const userId = await getCurrentUserId(supabase);
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
  const userId = await getCurrentUserId(supabase);
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
  const userId = await getCurrentUserId(supabase);
  await assertOwnsNoteAndTag(supabase, userId, noteId, tagId);
  const { error } = await supabase
    .from("note_tags")
    .delete()
    .eq("note_id", noteId)
    .eq("tag_id", tagId);
  if (error) throw error;
}
```

- [ ] **Step 2: Create `app/actions/notes.ts`**

```ts
"use server";

import {
  getNotes,
  searchNotes,
  createNote,
  updateNote,
  deleteNote,
  type Note,
} from "@/app/lib/db";

export async function getNotesAction(): Promise<Note[]> {
  return getNotes();
}

export async function searchNotesAction(query: string): Promise<Note[]> {
  return searchNotes(query);
}

export async function createNoteAction(
  title: string,
  body: string,
  collectionId?: string | null
): Promise<Note> {
  return createNote(title, body, collectionId);
}

export async function updateNoteAction(
  id: string,
  fields: Partial<Pick<Note, "title" | "body" | "collection_id">>
): Promise<Note> {
  return updateNote(id, fields);
}

export async function deleteNoteAction(id: string): Promise<void> {
  return deleteNote(id);
}
```

- [ ] **Step 3: Create `app/actions/collections.ts`**

```ts
"use server";

import {
  getCollections,
  createCollection,
  renameCollection,
  type Collection,
} from "@/app/lib/db";

export async function getCollectionsAction(): Promise<Collection[]> {
  return getCollections();
}

export async function createCollectionAction(name: string): Promise<Collection> {
  return createCollection(name);
}

export async function renameCollectionAction(id: string, name: string): Promise<Collection> {
  return renameCollection(id, name);
}
```

- [ ] **Step 4: Create `app/actions/tags.ts`**

```ts
"use server";

import {
  getTags,
  getNoteTags,
  addTagToNoteByName,
  removeTagFromNote,
  type Tag,
} from "@/app/lib/db";

export async function getTagsAction(): Promise<Tag[]> {
  return getTags();
}

export async function getNoteTagsAction(): Promise<{ note_id: string; tag: Tag }[]> {
  return getNoteTags();
}

export async function addTagToNoteByNameAction(noteId: string, name: string): Promise<Tag> {
  return addTagToNoteByName(noteId, name);
}

export async function removeTagFromNoteAction(noteId: string, tagId: string): Promise<void> {
  return removeTagFromNote(noteId, tagId);
}
```

- [ ] **Step 5: Type-check (expected errors are known and will be fixed in later tasks)**

Run:
```
npx tsc --noEmit
```
Expected: errors **only** in `app/protected/page.tsx` and the four hook files under `components/notes/hooks/` (they still call the old `db.ts` signatures with a `supabase` argument that no longer exists). Confirm `app/lib/db.ts`, `app/actions/notes.ts`, `app/actions/collections.ts`, and `app/actions/tags.ts` report **zero** errors themselves — if any of those four files have an error, fix it before moving on.

**Do not commit yet** — the project doesn't build cleanly until Task 8 is done.

---

### Task 3: Migrate `app/protected/page.tsx` (NotesLoader)

**Files:**
- Modify: `part1/app/protected/page.tsx` (full rewrite)

**Interfaces:**
- Consumes: `getNotesAction()`, `getCollectionsAction()`, `getTagsAction()`, `getNoteTagsAction()` from Task 2's action files; `Tag` type from `@/app/lib/db`.
- Produces: no new exports — `NotesWorkspace` is still called with the same four props as before (`initialNotes`, `initialCollections`, `initialTags`, `initialNoteTags`), unchanged shape.

- [ ] **Step 1: Rewrite the file**

Replace the entire contents of `part1/app/protected/page.tsx` with:

```tsx
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getNotesAction } from "@/app/actions/notes";
import { getCollectionsAction } from "@/app/actions/collections";
import { getTagsAction, getNoteTagsAction } from "@/app/actions/tags";
import type { Tag } from "@/app/lib/db";
import NotesWorkspace from "@/components/notes/notes-workspace";
import NotesSkeleton from "@/components/notes/notes-skeleton";

async function NotesLoader() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const [notes, collections, tags, noteTagRows] = await Promise.all([
    getNotesAction(),
    getCollectionsAction(),
    getTagsAction(),
    getNoteTagsAction(),
  ]);

  // Build noteId → Tag[] map
  const noteTagsMap: Record<string, Tag[]> = {};
  for (const { note_id, tag } of noteTagRows) {
    if (!noteTagsMap[note_id]) noteTagsMap[note_id] = [];
    noteTagsMap[note_id].push(tag);
  }

  return (
    <NotesWorkspace
      initialNotes={notes}
      initialCollections={collections}
      initialTags={tags}
      initialNoteTags={noteTagsMap}
    />
  );
}

export default function ProtectedPage() {
  return (
    <Suspense fallback={<NotesSkeleton />}>
      <NotesLoader />
    </Suspense>
  );
}
```

Note this keeps its own `createClient()` + `auth.getUser()` call for the page-level redirect-if-logged-out UX check — that's a separate, legitimate concern from the DAL's own server-side auth check (the guide's pattern: page-level check controls what UI renders; the DAL's check is what actually gates data access).

- [ ] **Step 2: Type-check**

Run:
```
npx tsc --noEmit
```
Expected: `app/protected/page.tsx` no longer appears in the error list. Remaining errors should now be only in the four hook files.

**Do not commit yet.**

---

### Task 4: Migrate `use-notes.ts`

**Files:**
- Modify: `part1/components/notes/hooks/use-notes.ts` (full rewrite)

**Interfaces:**
- Consumes: `getNotesAction`, `createNoteAction`, `updateNoteAction`, `deleteNoteAction` from `@/app/actions/notes`; `Note` type from `@/app/lib/db`.
- Produces: `useNotes(initialNotes: Note[], onError: (msg: string) => void)` — same return shape as before, **but the first parameter (`supabase`) is removed**. Task 8 (`notes-workspace.tsx`) must call it as `useNotes(initialNotes, setError)`, not `useNotes(supabase, initialNotes, setError)`.

- [ ] **Step 1: Rewrite the file**

Replace the entire contents of `part1/components/notes/hooks/use-notes.ts` with:

```ts
import { useRef, useState } from "react";
import {
  getNotesAction,
  createNoteAction,
  updateNoteAction,
  deleteNoteAction,
} from "@/app/actions/notes";
import type { Note } from "@/app/lib/db";

export function useNotes(initialNotes: Note[], onError: (msg: string) => void) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialNotes[0]?.id ?? null
  );
  const [title, setTitle] = useState(initialNotes[0]?.title ?? "");
  const [body, setBody] = useState(initialNotes[0]?.body ?? "");
  const [saving, setSaving] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    noteId: string;
    x: number;
    y: number;
  } | null>(null);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef<{ id: string; title: string; body: string } | null>(null);

  const selectedNote = notes.find((n) => n.id === selectedId) ?? null;

  // Shared by the immediate flush and the debounced autosave so both paths
  // commit/merge/report errors identically.
  async function commitSave(id: string, t: string, b: string) {
    try {
      const updated = await updateNoteAction(id, { title: t, body: b });
      setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
    } catch (e) {
      console.error("Save failed:", e);
      onError("Failed to save. Please try again.");
    }
  }

  async function flushPendingSave() {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (!dirtyRef.current) return;
    const { id, title: t, body: b } = dirtyRef.current;
    dirtyRef.current = null;
    await commitSave(id, t, b);
  }

  function scheduleSave(id: string, t: string, b: string) {
    dirtyRef.current = { id, title: t, body: b };
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      saveTimerRef.current = null;
      if (dirtyRef.current?.id !== id) return;
      const pending = dirtyRef.current;
      dirtyRef.current = null;
      setSaving(true);
      try {
        await commitSave(pending.id, pending.title, pending.body);
      } finally {
        setSaving(false);
      }
    }, 800);
  }

  async function handleSelectNote(id: string): Promise<boolean> {
    if (id === selectedId) return false;
    await flushPendingSave();
    const note = notes.find((n) => n.id === id)!;
    setSelectedId(id);
    setTitle(note.title);
    setBody(note.body ?? "");
    return true;
  }

  function handleTitleChange(value: string) {
    setTitle(value);
    if (selectedId) scheduleSave(selectedId, value, body);
  }

  function handleBodyChange(value: string) {
    setBody(value);
    if (selectedId) scheduleSave(selectedId, title, value);
  }

  async function handleNewNote(): Promise<boolean> {
    try {
      await flushPendingSave();
      const note = await createNoteAction("Untitled", "");
      setNotes((prev) => [note, ...prev]);
      setSelectedId(note.id);
      setTitle(note.title);
      setBody("");
      return true;
    } catch {
      onError("Failed to create note.");
      return false;
    }
  }

  async function handleDelete(): Promise<boolean> {
    if (!selectedId) return false;
    const idToDelete = selectedId;
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    dirtyRef.current = null;
    try {
      await deleteNoteAction(idToDelete);
      const remaining = notes.filter((n) => n.id !== idToDelete);
      setNotes(remaining);
      const next = remaining[0] ?? null;
      setSelectedId(next?.id ?? null);
      setTitle(next?.title ?? "");
      setBody(next?.body ?? "");
      return true;
    } catch {
      onError("Failed to delete note.");
      return false;
    }
  }

  async function handleAssignCollection(collectionId: string | null) {
    if (!selectedId) return;
    try {
      const updated = await updateNoteAction(selectedId, {
        collection_id: collectionId,
      });
      setNotes((prev) => prev.map((n) => (n.id === selectedId ? updated : n)));
    } catch {
      onError("Failed to assign collection.");
    }
  }

  function handleNoteContextMenu(e: React.MouseEvent, noteId: string) {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ noteId, x: e.clientX, y: e.clientY });
  }

  async function handleMoveNote(noteId: string, collectionId: string | null) {
    setContextMenu(null);
    try {
      const updated = await updateNoteAction(noteId, {
        collection_id: collectionId,
      });
      setNotes((prev) => prev.map((n) => (n.id === noteId ? updated : n)));
    } catch {
      onError("Failed to move note.");
    }
  }

  async function handleRefresh() {
    try {
      const fresh = await getNotesAction();
      setNotes(fresh);
    } catch {
      onError("Failed to load notes.");
    }
  }

  return {
    notes,
    selectedId,
    selectedNote,
    title,
    body,
    saving,
    contextMenu,
    setContextMenu,
    handleSelectNote,
    handleTitleChange,
    handleBodyChange,
    handleNewNote,
    handleDelete,
    handleAssignCollection,
    handleNoteContextMenu,
    handleMoveNote,
    handleRefresh,
  };
}
```

- [ ] **Step 2: Type-check**

Run:
```
npx tsc --noEmit
```
Expected: `components/notes/hooks/use-notes.ts` no longer appears in the error list (it will still show errors from `notes-workspace.tsx` calling it with the old 2-argument signature — that's expected until Task 8).

**Do not commit yet.**

---

### Task 5: Migrate `use-collections.ts`

**Files:**
- Modify: `part1/components/notes/hooks/use-collections.ts` (full rewrite)

**Interfaces:**
- Consumes: `createCollectionAction`, `renameCollectionAction` from `@/app/actions/collections`; `Collection` type from `@/app/lib/db`.
- Produces: `useCollections(initialCollections: Collection[], onError: (msg: string) => void)` — same return shape as before, **`supabase` parameter removed**.

- [ ] **Step 1: Rewrite the file**

Replace the entire contents of `part1/components/notes/hooks/use-collections.ts` with:

```ts
import { useState } from "react";
import {
  createCollectionAction,
  renameCollectionAction,
} from "@/app/actions/collections";
import type { Collection } from "@/app/lib/db";

export function useCollections(
  initialCollections: Collection[],
  onError: (msg: string) => void
) {
  const [collections, setCollections] = useState<Collection[]>(initialCollections);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [uncollectedExpanded, setUncollectedExpanded] = useState(true);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [showNewCollectionInput, setShowNewCollectionInput] = useState(false);
  const [renamingCollectionId, setRenamingCollectionId] = useState<string | null>(null);

  function toggleCollection(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleUncollectedExpanded() {
    setUncollectedExpanded((v) => !v);
  }

  function startRenameCollection(id: string) {
    setRenamingCollectionId(id);
  }

  function cancelRenameCollection() {
    setRenamingCollectionId(null);
  }

  async function handleRenameCollection(id: string, newName: string) {
    const name = newName.trim();
    setRenamingCollectionId(null);
    if (!name || name === collections.find((c) => c.id === id)?.name) return;
    try {
      const updated = await renameCollectionAction(id, name);
      setCollections((prev) =>
        prev.map((c) => (c.id === id ? updated : c))
            .sort((a, b) => a.name.localeCompare(b.name))
      );
    } catch {
      onError("Failed to rename collection.");
    }
  }

  async function handleNewCollection(e: React.FormEvent) {
    e.preventDefault();
    const name = newCollectionName.trim();
    if (!name) return;
    try {
      const collection = await createCollectionAction(name);
      setCollections((prev) =>
        [...prev, collection].sort((a, b) => a.name.localeCompare(b.name))
      );
      setExpandedIds((prev) => new Set(prev).add(collection.id));
      setNewCollectionName("");
      setShowNewCollectionInput(false);
    } catch {
      onError("Failed to create collection.");
    }
  }

  return {
    collections,
    expandedIds,
    uncollectedExpanded,
    toggleCollection,
    toggleUncollectedExpanded,
    newCollectionName,
    setNewCollectionName,
    showNewCollectionInput,
    setShowNewCollectionInput,
    renamingCollectionId,
    startRenameCollection,
    cancelRenameCollection,
    handleRenameCollection,
    handleNewCollection,
  };
}
```

- [ ] **Step 2: Type-check**

Run:
```
npx tsc --noEmit
```
Expected: `components/notes/hooks/use-collections.ts` no longer appears in the error list.

**Do not commit yet.**

---

### Task 6: Migrate `use-tags.ts`

This hook also drops its old client-side "check local `tags` state first, then `createTag`, then on a uniqueness race `findTagByName`" sequence (up to 3 sequential Supabase calls) in favor of calling the single consolidated `addTagToNoteByNameAction` (1 client→server round trip; the find-or-create-or-link logic now happens entirely inside that one server call). This is a deliberate simplification enabled by the migration, not an oversight — `addTagToNoteByName` in the DAL (Task 2) already handles both "tag exists" and "tag doesn't exist yet" transparently.

**Files:**
- Modify: `part1/components/notes/hooks/use-tags.ts` (full rewrite)

**Interfaces:**
- Consumes: `addTagToNoteByNameAction`, `removeTagFromNoteAction` from `@/app/actions/tags`; `Tag` type from `@/app/lib/db`.
- Produces: `useTags(initialTags: Tag[], initialNoteTags: Record<string, Tag[]>, selectedId: string | null, onError: (msg: string) => void)` — same return shape as before, **`supabase` parameter removed** (was previously the first parameter).

- [ ] **Step 1: Rewrite the file**

Replace the entire contents of `part1/components/notes/hooks/use-tags.ts` with:

```ts
import { useState } from "react";
import {
  addTagToNoteByNameAction,
  removeTagFromNoteAction,
} from "@/app/actions/tags";
import type { Tag } from "@/app/lib/db";

export function useTags(
  initialTags: Tag[],
  initialNoteTags: Record<string, Tag[]>,
  selectedId: string | null,
  onError: (msg: string) => void
) {
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [noteTags, setNoteTags] = useState<Record<string, Tag[]>>(initialNoteTags);
  const [activeTagIds, setActiveTagIds] = useState<Set<string>>(new Set());
  const [tagInput, setTagInput] = useState("");
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);

  const selectedNoteTags = selectedId ? (noteTags[selectedId] ?? []) : [];

  const tagSuggestions = tags.filter(
    (t) =>
      !selectedNoteTags.some((st) => st.id === t.id) &&
      t.name.toLowerCase().includes(tagInput.toLowerCase()) &&
      tagInput.trim().length > 0
  );

  function toggleTagFilter(tagId: string) {
    setActiveTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      return next;
    });
  }

  function clearTagFilter() {
    setActiveTagIds(new Set());
  }

  function clearNoteTags(noteId: string) {
    setNoteTags((prev) => {
      const next = { ...prev };
      delete next[noteId];
      return next;
    });
  }

  async function handleAddTag(tagName: string) {
    if (!selectedId || !tagName.trim()) return;
    const name = tagName.trim();

    if (selectedNoteTags.some((t) => t.name.toLowerCase() === name.toLowerCase()))
      return;

    try {
      const tag = await addTagToNoteByNameAction(selectedId, name);
      setTags((prev) =>
        prev.some((t) => t.id === tag.id)
          ? prev
          : [...prev, tag].sort((a, b) => a.name.localeCompare(b.name))
      );
      setNoteTags((prev) => ({
        ...prev,
        [selectedId]: [...(prev[selectedId] ?? []), tag],
      }));
      setTagInput("");
      setTagDropdownOpen(false);
    } catch {
      onError("Failed to add tag.");
    }
  }

  async function handleRemoveTag(tagId: string) {
    if (!selectedId) return;
    try {
      await removeTagFromNoteAction(selectedId, tagId);
      setNoteTags((prev) => ({
        ...prev,
        [selectedId]: (prev[selectedId] ?? []).filter((t) => t.id !== tagId),
      }));
    } catch {
      onError("Failed to remove tag.");
    }
  }

  return {
    tags,
    noteTags,
    activeTagIds,
    tagInput,
    setTagInput,
    tagDropdownOpen,
    setTagDropdownOpen,
    selectedNoteTags,
    tagSuggestions,
    toggleTagFilter,
    clearTagFilter,
    clearNoteTags,
    handleAddTag,
    handleRemoveTag,
  };
}
```

- [ ] **Step 2: Type-check**

Run:
```
npx tsc --noEmit
```
Expected: `components/notes/hooks/use-tags.ts` no longer appears in the error list. `isUniqueViolation` is no longer imported here — confirm no unused-import error either (it simply isn't referenced in this file anymore).

**Do not commit yet.**

---

### Task 7: Migrate `use-search.ts`

**Files:**
- Modify: `part1/components/notes/hooks/use-search.ts` (full rewrite)

**Interfaces:**
- Consumes: `searchNotesAction` from `@/app/actions/notes`; `Note` type from `@/app/lib/db`.
- Produces: `useSearch(onError: (msg: string) => void)` — same return shape as before, **`supabase` parameter removed** (was previously the first parameter).

- [ ] **Step 1: Rewrite the file**

Replace the entire contents of `part1/components/notes/hooks/use-search.ts` with:

```ts
import { useRef, useState } from "react";
import { searchNotesAction } from "@/app/actions/notes";
import type { Note } from "@/app/lib/db";

export function useSearch(onError: (msg: string) => void) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Note[] | null>(null);
  const [searching, setSearching] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSearchChange(query: string) {
    setSearchQuery(query);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (query.trim().length < 2) {
      setSearchResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchNotesAction(query.trim());
        setSearchResults(results);
      } catch {
        onError("Search failed.");
        setSearchResults(null);
      } finally {
        setSearching(false);
      }
    }, 300);
  }

  return { searchQuery, searchResults, searching, handleSearchChange };
}
```

- [ ] **Step 2: Type-check**

Run:
```
npx tsc --noEmit
```
Expected: `components/notes/hooks/use-search.ts` no longer appears in the error list. The only remaining error should now be in `components/notes/notes-workspace.tsx` (it still creates a browser Supabase client and passes it to all four hooks with the old signatures).

**Do not commit yet.**

---

### Task 8: Migrate `notes-workspace.tsx`, final verification, and commit

This is the last piece — after this task the whole project should type-check cleanly.

**Files:**
- Modify: `part1/components/notes/notes-workspace.tsx` (full rewrite)

**Interfaces:**
- Consumes: `useNotes(initialNotes, onError)`, `useCollections(initialCollections, onError)`, `useTags(initialTags, initialNoteTags, selectedId, onError)`, `useSearch(onError)` — all from Tasks 4–7, none take a `supabase` argument anymore.
- Produces: No change to `NotesWorkspace`'s own props (`initialNotes`, `initialCollections`, `initialTags`, `initialNoteTags`) — Task 3's `NotesLoader` already calls it correctly.

- [ ] **Step 1: Rewrite the file**

Replace the entire contents of `part1/components/notes/notes-workspace.tsx` with:

```tsx
"use client";

import { useState } from "react";
import type { Note, Collection, Tag } from "@/app/lib/db";
import { useNotes } from "@/components/notes/hooks/use-notes";
import { useCollections } from "@/components/notes/hooks/use-collections";
import { useTags } from "@/components/notes/hooks/use-tags";
import { useSearch } from "@/components/notes/hooks/use-search";
import { NotesSidebar } from "@/components/notes/sidebar/notes-sidebar";
import { NoteEditor } from "@/components/notes/editor/note-editor";
import { ContextMenu } from "@/components/notes/sidebar/context-menu";
import { filterNotes } from "@/components/notes/utils";

export default function NotesWorkspace({
  initialNotes,
  initialCollections,
  initialTags,
  initialNoteTags,
}: {
  initialNotes: Note[];
  initialCollections: Collection[];
  initialTags: Tag[];
  initialNoteTags: Record<string, Tag[]>;
}) {
  const [error, setError] = useState<string | null>(null);

  const notesState = useNotes(initialNotes, setError);
  const collectionsState = useCollections(initialCollections, setError);
  const tagsState = useTags(
    initialTags,
    initialNoteTags,
    notesState.selectedId,
    setError
  );
  const searchState = useSearch(setError);

  const isFiltering = tagsState.activeTagIds.size > 0 || searchState.searchResults !== null;

  const filtered = filterNotes(notesState.notes, {
    noteTags: tagsState.noteTags,
    activeTagIds: tagsState.activeTagIds,
    searchResults: searchState.searchResults,
  });

  const uncollectedNotes = filtered.filter((n) => !n.collection_id);
  const notesByCollection: Record<string, Note[]> = {};
  for (const c of collectionsState.collections) {
    notesByCollection[c.id] = filtered.filter((n) => n.collection_id === c.id);
  }

  // Selecting/creating a note resets the tag-input UI, which lives in a
  // separate hook. Only reset when the underlying action actually happened —
  // re-clicking the already-selected note, or a failed create, is a no-op.
  async function selectNote(id: string) {
    const changed = await notesState.handleSelectNote(id);
    if (changed) {
      tagsState.setTagInput("");
      tagsState.setTagDropdownOpen(false);
    }
  }

  async function newNote() {
    const created = await notesState.handleNewNote();
    if (created) {
      tagsState.setTagInput("");
      tagsState.setTagDropdownOpen(false);
    }
  }

  async function deleteSelectedNote() {
    const idToDelete = notesState.selectedId;
    const deleted = await notesState.handleDelete();
    if (deleted && idToDelete) tagsState.clearNoteTags(idToDelete);
  }

  const contextMenu = notesState.contextMenu;

  return (
    <>
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          collections={collectionsState.collections}
          currentCollectionId={
            notesState.notes.find((n) => n.id === contextMenu.noteId)?.collection_id ?? null
          }
          onMove={(collectionId) => notesState.handleMoveNote(contextMenu.noteId, collectionId)}
          onClose={() => notesState.setContextMenu(null)}
        />
      )}
      <div className="flex h-full w-full overflow-hidden">
        <NotesSidebar
          onNewNote={newNote}
          searchQuery={searchState.searchQuery}
          onSearchChange={searchState.handleSearchChange}
          searching={searchState.searching}
          tags={tagsState.tags}
          activeTagIds={tagsState.activeTagIds}
          onToggleTagFilter={tagsState.toggleTagFilter}
          onClearTagFilter={tagsState.clearTagFilter}
          uncollectedNotes={uncollectedNotes}
          uncollectedExpanded={collectionsState.uncollectedExpanded}
          onToggleUncollected={collectionsState.toggleUncollectedExpanded}
          collections={collectionsState.collections}
          notesByCollection={notesByCollection}
          expandedIds={collectionsState.expandedIds}
          onToggleCollection={collectionsState.toggleCollection}
          renamingCollectionId={collectionsState.renamingCollectionId}
          onStartRenameCollection={collectionsState.startRenameCollection}
          onConfirmRenameCollection={collectionsState.handleRenameCollection}
          onCancelRenameCollection={collectionsState.cancelRenameCollection}
          noteTags={tagsState.noteTags}
          selectedId={notesState.selectedId}
          onSelectNote={selectNote}
          onNoteContextMenu={notesState.handleNoteContextMenu}
          isFiltering={isFiltering}
          newCollectionName={collectionsState.newCollectionName}
          onNewCollectionNameChange={collectionsState.setNewCollectionName}
          showNewCollectionInput={collectionsState.showNewCollectionInput}
          onShowNewCollectionInput={collectionsState.setShowNewCollectionInput}
          onNewCollectionSubmit={collectionsState.handleNewCollection}
        />

        <NoteEditor
          selectedNote={notesState.selectedNote}
          title={notesState.title}
          body={notesState.body}
          onTitleChange={notesState.handleTitleChange}
          onBodyChange={notesState.handleBodyChange}
          saving={notesState.saving}
          error={error}
          onDismissError={() => setError(null)}
          collections={collectionsState.collections}
          onAssignCollection={notesState.handleAssignCollection}
          onRefresh={notesState.handleRefresh}
          onDelete={deleteSelectedNote}
          onNewNote={newNote}
          selectedNoteTags={tagsState.selectedNoteTags}
          tagInput={tagsState.tagInput}
          onTagInputChange={tagsState.setTagInput}
          tagDropdownOpen={tagsState.tagDropdownOpen}
          onTagDropdownOpenChange={tagsState.setTagDropdownOpen}
          tagSuggestions={tagsState.tagSuggestions}
          onAddTag={tagsState.handleAddTag}
          onRemoveTag={tagsState.handleRemoveTag}
        />
      </div>
    </>
  );
}
```

- [ ] **Step 2: Full project type-check**

Run:
```
npx tsc --noEmit
```
Expected: **zero errors**, project-wide.

- [ ] **Step 3: Lint every file touched in Tasks 2–8**

Run:
```
npx eslint app/lib/db.ts app/actions/notes.ts app/actions/collections.ts app/actions/tags.ts app/protected/page.tsx components/notes/hooks/use-notes.ts components/notes/hooks/use-collections.ts components/notes/hooks/use-tags.ts components/notes/hooks/use-search.ts components/notes/notes-workspace.tsx
```
Expected: no errors.

- [ ] **Step 4: Manual browser smoke test**

Run:
```
npm run dev
```
In the browser, sign in and verify, in order:
1. Create a new note — appears in the sidebar, editor opens on it.
2. Edit its title and body — wait ~1s, confirm no error toast (autosave committed).
3. Create a new collection, then move the note into it via the right-click context menu.
4. Rename the collection.
5. Add a new tag (one that doesn't exist yet) to the note.
6. Add an existing tag (one already used on another note) to the same note.
7. Remove a tag from the note.
8. Type a search query (2+ characters) that matches the note's title or body — confirm it appears in results.
9. Delete the note.

All 9 steps should behave identically to before this migration (same debounce timing, same optimistic UI updates, no new error toasts). Stop the dev server once confirmed.

- [ ] **Step 5: Commit**

From the repo root (`C:\Projects\TuringCollege\BwAI\sprint3`):
```bash
git add part1/app/lib/db.ts part1/app/actions/notes.ts part1/app/actions/collections.ts part1/app/actions/tags.ts part1/app/protected/page.tsx part1/components/notes/hooks/use-notes.ts part1/components/notes/hooks/use-collections.ts part1/components/notes/hooks/use-tags.ts part1/components/notes/hooks/use-search.ts part1/components/notes/notes-workspace.tsx
git commit -m "$(cat <<'EOF'
Migrate notes/collections/tags data layer to Server Actions

nextjs-security-scanner correctly pointed out that the earlier
ownership-check fix in app/lib/db.ts executed client-side (the file was
imported by "use client" hooks), so those checks were trivially
bypassable and added no real protection beyond Postgres RLS.

app/lib/db.ts is now server-only (import "server-only", no more
SupabaseClient parameter — each function creates its own server client
and does its own auth check via a cache()-wrapped getCurrentUserId).
Three new "use server" files (app/actions/notes.ts, collections.ts,
tags.ts) provide thin delegating Server Actions. All Server Components
and client hooks now call the actions instead of touching Supabase
directly from the browser. Also consolidates the tag find-or-create-
then-link sequence (previously up to 3 sequential client round trips)
into one server-side call.

Verified: tsc --noEmit and eslint clean project-wide, manual smoke test
of create/edit/delete note, rename collection, add/remove tags
(new + existing), and search all confirmed working.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 6: Verify the commit**

Run (from repo root):
```
git status --short
git log --oneline -3
```
Expected: working tree clean (aside from anything unrelated already in progress elsewhere in the repo), and the new commit appears at the top of the log.

---

## After this plan

Not part of this plan, but the natural next step per the security-audit lab's own workflow: `/clear` (or a fresh session) and re-dispatch `@nextjs-security-scanner` against `part1/` to confirm, in a fresh context with no memory of this fix, that the High/Medium findings are resolved and nothing regressed.
