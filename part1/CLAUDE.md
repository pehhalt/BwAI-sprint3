# CLAUDE.md — part4 Notes App

This file provides guidance for building the notes app in `part4/`. It lives alongside a Supabase + Next.js (App Router) + TypeScript + Tailwind CSS starter that already has auth scaffolded.

---

## Stack

- **Next.js** (App Router, `app/` directory)
- **TypeScript**
- **Tailwind CSS**
- **Supabase** via `supabase-js` — no Supabase MCP server

---

## Non-Negotiable Rules

1. **All database reads and writes go through `app/lib/db.ts`.** No component, page, or route handler may call `supabase` directly — import from `db.ts` only.
2. Schema field names in code must exactly match column names in Supabase. No aliases that drift from the database.
3. The app must work for an authenticated user. Auth is already scaffolded — do not remove or bypass it.
4. No backend beyond Supabase. No custom API routes that replicate what `supabase-js` can do directly.

---

## Authentication

All authentication is handled by Supabase Auth. The app supports email/password and Google OAuth sign-in.

### Authentication Rules

1. **Server-side session verification required.** Every signed-in-only page must verify the user's session with the Supabase Auth server before it loads, and redirect to the sign-in page if the user is not signed in. Do not rely on the browser-side session alone. Use `createClient()` from `lib/supabase/server.ts` and check `auth.getUser()`.

2. **Row Level Security (RLS) enforces data isolation.** All tables use RLS policies that scope data to the authenticated user via `user_id`. Database triggers automatically set `user_id` on insert — the application never sets it explicitly. This means every Supabase query is automatically filtered to the current user's data.

3. **OAuth credentials and redirect URIs are configuration, not code.** Supabase OAuth credentials are stored in `part4/.env.local` (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`). Redirect URIs are configured in the Supabase dashboard. Never hardcode OAuth app IDs, secrets, or redirect URIs in the codebase.

---

## Database Schema

Create these tables in Supabase before writing app code.

### `collections`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | primary key, default `gen_random_uuid()` |
| `name` | `text` | not null |
| `created_at` | `timestamptz` | default `now()` |

### `notes`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | primary key, default `gen_random_uuid()` |
| `title` | `text` | not null |
| `body` | `text` | |
| `collection_id` | `uuid` | nullable, foreign key → `collections.id` |
| `created_at` | `timestamptz` | default `now()` |
| `updated_at` | `timestamptz` | default `now()` |

### `tags`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | primary key, default `gen_random_uuid()` |
| `name` | `text` | not null, unique |
| `created_at` | `timestamptz` | default `now()` |

### `note_tags` (join table)
| Column | Type | Notes |
|--------|------|-------|
| `note_id` | `uuid` | foreign key → `notes.id`, not null |
| `tag_id` | `uuid` | foreign key → `tags.id`, not null |
| primary key | | composite `(note_id, tag_id)` |

---

## Required Features Checklist

- [ ] `app/lib/db.ts` exists and exports all query helpers (no direct supabase calls elsewhere)
- [ ] Sidebar shows collections as expandable groups; clicking expands to reveal contained notes
- [ ] Uncollected notes appear under an "All notes" or "Uncollected" group
- [ ] "New collection" control in sidebar — prompts for a name, persists immediately
- [ ] When viewing a note: assign it to a collection via dropdown/picker; change persists
- [ ] When viewing a note: add or remove tags; tags appear on the note card in the sidebar
- [ ] Sidebar tag filter — selecting one or more tags narrows the list to notes carrying **all** selected tags
- [ ] Search input at top of workspace — queries across `title` and `body`; updates as user types; respects active tag filter
- [ ] Readable empty states for: empty collection, no search results, no tag matches

---

## Optional Tasks (targeted)

Each optional task must be developed on a dedicated feature branch and merged via a pull request.

### Easy — Rename a collection
- Inline edit control on each collection name in the sidebar
- Saves on confirm (Enter or blur); persists to `collections.name` in Supabase
- Branch: `feat/rename-collection`

### Medium — Move notes between collections
- Drag-and-drop or right-click context menu on note cards in the sidebar
- Updates `notes.collection_id` in Supabase without opening the note
- Branch: `feat/move-notes`

### Hard — Server-side full-text search
- Move search from browser-side filter into a Supabase full-text search query
- Add a GIN index on `notes` covering `title` and `body` (use `to_tsvector`)
- User experience unchanged — typing in the search box still narrows the list in real time
- Branch: `feat/fts`

---

## Key File Locations

| Path | Purpose |
|------|---------|
| `app/lib/db.ts` | **Create this.** All Supabase query helpers live here |
| `lib/supabase/client.ts` | Browser Supabase client (already exists) |
| `lib/supabase/server.ts` | Server Supabase client (already exists) |
| `app/protected/` | The authenticated workspace — build the notes UI here |
| `app/globals.css` | Global styles |
| `tailwind.config.ts` | Tailwind config |

---

## Git Workflow

- `main` — stable, required features only
- Feature branches for optional tasks (see names above)
- Open a PR per optional task; do not merge directly to main
