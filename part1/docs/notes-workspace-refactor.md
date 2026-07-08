# Notes Workspace Refactor

Record of the structural audit and cleanup performed on `components/notes/`
before adding further features, using two project subagents defined in
`.claude/agents/`: `ai-architect` (structural review, read-only) and
`ai-code-reviewer` (diff review for dead code/duplication/behavior changes,
read-only).

---

## Audit findings

### ai-architect — structural weak points

Walked the codebase and flagged the weakest design choices most likely to
cause problems as the app grows:

1. **`notes-workspace.tsx` was a ~990-line "god component"** holding every
   state slice (notes, collections, tags, search, rename, context-menu,
   autosave) plus every sub-component.
2. **Load-everything-then-filter-in-memory** — `getNotes` fetched all notes,
   tags, and `note_tags` on every load; filtering happened client-side. The
   server-side FTS helper existed but was only bolted on.
3. **Tag find-or-create race** — `handleAddTag` deduped against the
   client-loaded `tags` array before calling `createTag`; since `tags.name`
   is globally unique, concurrent creation could hit the unique constraint.
   `updateNote` also swallowed its real Supabase error into a generic
   message, unlike its sibling helpers.

### ai-code-reviewer — `git log -p -5`

Scanned recent commits for dead code, duplication, and behavior changes not
obvious from the diff:

- **Critical:** `app/notes/page.tsx` called `supabase` directly in a
  `useEffect`, bypassing `app/lib/db.ts` and skipping the server-side
  `auth.getUser()` check — both non-negotiable rules from `CLAUDE.md`. Looked
  like an unlinked leftover from earlier scaffolding.
- **Critical:** `searchNotes()` queried a `fts` tsvector column that no
  migration created, so every search silently failed.
- **Warning:** duplicated save-commit logic between `flushPendingSave` and
  the debounced `scheduleSave` timer.
- **Warning:** a copy-pasted empty-state condition
  (`activeTagIds.size > 0 || searchResults !== null || activeTagIds.size > 0`)
  repeated the same clause twice.
- **Warning:** `NoteCard` rendered tag pills with separate inline markup
  instead of reusing the `TagPill` component used in the editor.
- **Warning:** six root-level scratch scripts (`check-notes.js`,
  `recent-notes.js`, `search-notes.js`, `test-query.js`, `run-migration.js`,
  `update-schema.js`) hardcoded the Supabase URL/key and bypassed `db.ts`.

---

## Refactor: splitting `notes-workspace.tsx`

`components/notes/notes-workspace.tsx` was split into:

```
components/notes/
  notes-workspace.tsx   — thin orchestrator: owns the supabase client, the
                          4 hooks below, and derived note filtering
  utils.ts              — formatDate(), filterNotes()
  hooks/
    use-notes.ts         — notes list, selection, autosave, create/delete/
                          assign-collection/move/refresh, context-menu state
    use-collections.ts   — collections list, expand state, rename, new-
                          collection form
    use-tags.ts          — tags list, noteTags map, tag filter, tag input/
                          dropdown, add/remove tag
    use-search.ts         — search query/results/debounce
  sidebar/
    notes-sidebar.tsx, note-list.tsx, note-card.tsx, group-header.tsx,
    collection-header.tsx, context-menu.tsx
  editor/
    note-editor.tsx, tag-editor.tsx, tag-pill.tsx
```

Splitting `note-list.tsx` out (used for both "Uncollected" and each named
collection) fixed the duplicated empty-state condition by construction —
it's written once. `NoteCard` was changed to reuse `TagPill` via a new
`compact` prop instead of duplicating the tag-pill markup. `use-notes.ts`
collapses the save-commit logic into one `commitSave()` used by both the
immediate flush and the debounced autosave path.

`NotesWorkspace`'s public interface (props from `app/protected/page.tsx`)
was unchanged — confirmed via grep that no other file imports the internal
sub-components, so the split was purely internal.

### Regressions caught during review

A follow-up `ai-code-reviewer` pass on the refactor diff caught two real
behavior changes introduced by the split (not present in the original
monolithic component):

1. Tag cleanup (`clearNoteTags`) ran even when the underlying note delete
   failed, because the orchestrator called it unconditionally after
   `await`ing a handler that swallowed its own errors.
2. The tag-input UI reset (`setTagInput("")` / `setTagDropdownOpen(false)`)
   ran even when reselecting the already-selected note (a no-op in the
   original) or when note creation failed.

Fix: `handleSelectNote`, `handleNewNote`, and `handleDelete` in
`use-notes.ts` now return a `boolean` indicating whether they actually
changed state, and the orchestrator only reacts (resets tag UI / clears
tags) when that's `true`.

---

## Fixes applied after the split

| Finding | Resolution |
|---|---|
| `app/notes/page.tsx` bypassing `db.ts`/auth | Deleted (dead/unlinked code) |
| 6 root-level scratch scripts with hardcoded credentials | Deleted |
| `updateNote` swallowing its real error | Now rethrows the Supabase error, matching sibling helpers |
| Tag find-or-create race | Added `isUniqueViolation()` / `findTagByName()` in `db.ts`; `handleAddTag` recovers by looking up the tag another request just created instead of failing |
| Search querying a non-existent `fts` column | On `main`: real browser-side title/body filter (`filterNotes` in `utils.ts`), matching the required-feature scope in `CLAUDE.md`. On `feat/fts`: real server-side full-text search restored (see below) |

### `feat/fts` branch

Per `CLAUDE.md`'s rule that optional tasks live on a dedicated branch/PR, the
"Hard" full-text search task was built on `feat/fts`:

- `supabase/migrations/20260708120000_notes_fts.sql` — generated `fts`
  tsvector column over `title`/`body` + GIN index (`notes_fts_gin`).
- `db.ts`'s `searchNotes()` restored, using `.textSearch("fts", …)`.
- `use-search.ts` restored to its debounced, server-querying form (with the
  `searching` indicator state).
- `filterNotes()` on this branch takes `searchResults: Note[] | null` (server
  truth) rather than doing its own substring match.

Confirmed via the Supabase SQL console that the `fts` column and GIN index
were already live on the linked project with a matching generation
expression — the migration file was adjusted to name the index
`notes_fts_gin` (matching what's live) so it's a true no-op if re-run.

---

## Verification

- `npx tsc --noEmit` and `npm run build` pass clean on both `main` and
  `feat/fts`.
- Manual click-through: create/select/edit/delete a note, autosave,
  create/rename a collection, assign/move notes via dropdown and
  right-click context menu, add/remove tags, filter by tag(s), search, and
  the empty states (empty collection, no search results, no tag matches).
