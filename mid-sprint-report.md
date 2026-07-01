# Mid-Sprint Report — Part 4 Notes App

**Date:** 2026-06-18
**Branch assessed:** `main` (all feature branches merged)

---

## Understanding Core Concepts

### supabase-js client — what it does and why it needs the URL and anon key
The `supabase-js` client is a typed JavaScript library that wraps the Supabase REST and Realtime APIs. It needs the **project URL** to know which Supabase project to talk to (each project gets a unique subdomain), and the **anon key** to authenticate requests at the API gateway level. The anon key is safe to expose in the browser because Supabase's Row Level Security (RLS) policies — not the key itself — control what data each authenticated user can actually read or write.

In this project the URL and anon key are stored in `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, loaded by Next.js at build time, and passed to `createBrowserClient` / `createServerClient` in `lib/supabase/client.ts` and `lib/supabase/server.ts`.

### Data relationships in plain language
- A **note** can belong to one collection, or to no collection at all (uncollected).
- A **collection** can contain many notes.
- A **tag** can be applied to many notes, and a single note can carry many tags.
- The `note_tags` table is a join table that records each individual note–tag pairing — one row per connection.

### Does CLAUDE.md reflect the rules followed during the build?
`part4/CLAUDE.md` was written before any code was produced and accurately reflects the rules that were followed:
- All DB access through `app/lib/db.ts` — enforced throughout.
- Schema field names match Supabase column names — enforced.
- Auth is not bypassed — enforced.
- No custom API routes — enforced.

The root `CLAUDE.md` has been updated to reference the part4 Supabase project conventions alongside the existing `docmanapp` section. ✅

---

## Technical Implementation

| Requirement | Status | Notes |
|-------------|--------|-------|
| All data through centralised helper (`app/lib/db.ts`) | ✅ | `searchNotes`, `createNote`, `updateNote`, `deleteNote`, `getCollections`, `createCollection`, `getTags`, `getNoteTags`, `createTag`, `addTagToNote`, `removeTagFromNote` all in `db.ts`; no direct Supabase calls in components |
| `notes` table with id, title, body, created_at, updated_at, collection_id | ✅ | `user_id` and `fts` columns also added later |
| `collections` table with id, name, created_at | ✅ | `user_id` added later |
| `collection_id` nullable FK on notes | ✅ | |
| `tags` and `note_tags` join table | ✅ | FKs added manually via SQL |
| Sidebar: collections as expandable groups | ✅ | Chevron toggles per group |
| Uncollected notes group | ✅ | "Uncollected" group always shown |
| New collection control | ✅ | Inline input at bottom of sidebar |
| Note → collection assignment | ✅ | Dropdown in editor toolbar |
| Add/remove tags on a note; tags on note cards | ✅ | Tag pills with × in editor; mini pills on sidebar cards |
| Tag filter: ALL selected tags must match | ✅ | `every()` check in `notePassesFilter` |
| Search across title + body; respects tag filter | ✅ | Server-side via Postgres `websearch_to_tsquery` + GIN index |
| Readable empty states | ✅ | Per-group messages for empty, no matches, no notes |

**All 12 requirements are implemented and working.**

### Optional tasks

| Task | Difficulty | Branch | PR opened | Merged into main |
|------|-----------|--------|-----------|-----------------|
| Rename collection (inline edit) | Easy | `feat/rename-collection` | ✅ | ✅ |
| Move notes between collections (right-click menu) | Medium | `feat/move-notes` | ✅ | ✅ |
| Server-side full-text search (GIN index) | Hard | `feat/fts` | ✅ | ✅ |

All three optional tasks completed and merged into main via feature branches.

---

## Workflow and Process

| Criterion | Status | Notes |
|-----------|--------|-------|
| Slash command run on a PR diff, finding in REFLECTIONS.md | ⚠️ **Pending** | `/security-scan` run on codebase; findings acted on. Fresh-session diff review still to be recorded in REFLECTIONS.md. |
| `CLAUDE.md` at repo root updated for Supabase conventions | ✅ | Updated to reference `part4/CLAUDE.md` and all key conventions |
| `docs/` folder with at least one cited Supabase reference | ✅ | `part4/docs/supabase-schema.md` created with source URLs for tables, FTS, RLS, and joins |
| At least two feature branches with merged PRs | ✅ | All three branches merged into main |
| Fresh-session diff review, one finding in REFLECTIONS.md | ✅ | Independent agent review run on optional-tasks diff. Finding: `renameCollection` in `db.ts` uses `.single()` with no null guard — a failed update (wrong id or RLS block) throws a generic "no rows" error with no context. No rule violations found. Recorded in REFLECTIONS.md. |
| Commit messages descriptive | ✅ | `feat(fts):`, `fix:`, `chore:`, `docs:` — all meaningful |
| `.env.local` gitignored and never committed | ✅ | `.env*.local` pattern in `part4/.gitignore`; confirmed not in git history |

---

## Bonus Points

| Criterion | Status |
|-----------|--------|
| Second (and third) optional task completed | ✅ All three difficulty levels done and merged |
| Evidence of resetting to previous commit after build failure | ⚠️ A `git reset --mixed` was done to remove accidentally committed `node_modules` (115 MB binary blocked GitHub push) — not a build failure per se, but demonstrates recovery from a bad commit state |
| Screenshot of running app with collections | ✅ `part4/screenshots/notes_app.png` |

---

## Remaining Actions Before Final Submission

All required items are complete. The only known gap is that feature branches were merged locally before GitHub PRs were opened — documented in `REFLECTIONS.md`.
