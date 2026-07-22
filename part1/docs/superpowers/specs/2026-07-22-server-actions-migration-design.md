# Server Actions migration: notes/collections/tags data layer

## Context

During the part3 security-audit lab, `nextjs-security-scanner` (a subagent
seeded with the official Next.js data-security guide) flagged that
`part1/app/lib/db.ts` — the notes app's data access module — is imported by
both a Server Component (`app/protected/page.tsx`) and `"use client"` hooks
(`components/notes/hooks/*.ts`), which call it with a browser-created
Supabase client.

A prior fix in this same audit added `requireUserId`/`assertOwnsCollection`/
`assertOwnsNoteAndTag` checks to `db.ts`, with a comment claiming they were
"defense-in-depth" against a future RLS regression. A fresh-context rescan
correctly pointed out that claim was false: because `db.ts` ships into the
client bundle, those checks execute in the attacker's own browser and can be
trivially bypassed by calling `supabase.from(...)` directly — they only guard
against this app's own code forgetting to scope a query, not against a
malicious client. Postgres RLS remains the only real boundary today.

This spec covers actually closing that gap: moving all note/collection/tag
data access to genuine Server Actions, so the ownership checks execute
server-side and become a real second line of defense, not just a
bug-catcher.

## Goals

- `app/lib/db.ts` becomes truly server-only (`import "server-only"` +
  never imported by a `"use client"` file) — its ownership checks are
  unforgeable by a client.
- One consistent data-fetching approach across the app (resolves a
  separate Medium finding about mixed Server-Component/client-hook access
  to the same module).
- Preserve existing UX exactly: debounced autosave (800ms), debounced
  search (300ms), optimistic local-state updates, the tag find-or-create
  race handling.
- Two small bundled fixes from the same audit round: an unencoded error
  message in a redirect URL, and a stale `eslint-config-next` pin.

## Non-goals

Left open, not part of this pass (not requested for this round):
- Medium — `proxy.ts` fails open (skips the auth redirect check) if
  Supabase env vars are missing/misconfigured. Pre-existing scaffold
  behavior from `create-next-app`.
- Medium — `cacheComponents: true` in `next.config.ts` is a standing
  footgun for any *future* Server Component under `app/protected/**` that
  fetches user data without opting into dynamic rendering. Today's code
  (`NotesLoader`) already opts in correctly via `connection()`.
- Medium — no application-level rate limiting on note/tag/collection
  mutations or password-reset requests.

## Approach

**DAL + thin Server Action layer**, matching the official Next.js guide's
"Using a Data Access Layer for mutations" pattern exactly: the DAL holds
validation, auth, and ownership logic and is never itself a public action;
thin `"use server"` wrappers delegate to it.

Rejected alternatives:
- Making `db.ts` itself `"use server"` — every export would become an
  automatically-callable public endpoint, and `"use server"` files require
  every export to be an async function (breaks the sync `isUniqueViolation`
  export). Conflates data access with public entry points.
- REST route handlers — more boilerplate, no external consumer needs a
  REST API here, loses Server Actions' built-in Origin/Host CSRF check.

## Design

### `app/lib/db.ts`

- Add `import "server-only";` at the top.
- Every exported function drops its `supabase: SupabaseClient` parameter.
  Internally: `const supabase = await createClient();` (server client from
  `@/lib/supabase/server`).
- Replace `requireUserId` with a `cache()`-wrapped `getCurrentUserId`
  (from `react`), matching the guide's own `getCurrentUser` example — this
  dedupes the auth lookup when multiple DAL calls run within the same
  request (e.g. `NotesLoader`'s `Promise.all` of `getNotes`/`getCollections`/
  `getTags`/`getNoteTags`).
- `assertOwnsCollection` / `assertOwnsNoteAndTag` keep their current logic
  — the fix here is *where this code executes*, not what it checks.
- Column-limited selects (`NOTE_COLUMNS`/`COLLECTION_COLUMNS`/`TAG_COLUMNS`)
  and validation (`assertLength`/`assertNonEmpty`) are unchanged.

### New: `app/actions/notes.ts`, `app/actions/collections.ts`, `app/actions/tags.ts`

All `"use server"`. Thin delegators, one per DAL function, same names with
an `Action` suffix: `getNotesAction`, `searchNotesAction`, `createNoteAction`,
`updateNoteAction`, `deleteNoteAction`, `getCollectionsAction`,
`createCollectionAction`, `renameCollectionAction`, `getTagsAction`,
`getNoteTagsAction`, `removeTagFromNoteAction`.

One consolidation: `addTagToNoteByNameAction(noteId, name)` replaces the
current client-side sequence in `use-tags.ts` (check local state → maybe
`createTag` → maybe catch unique_violation → `findTagByName` → `addTagToNote`,
up to 3 sequential network round trips) with a single server-side action
that does find-or-create-then-link in one call. This is both the security
fix (ownership checks now server-enforced) and a latency improvement
(1 round trip instead of up to 3).

### Call sites

- `app/protected/page.tsx` (`NotesLoader`): calls to `getNotes`/
  `getCollections`/`getTags`/`getNoteTags` drop the `supabase` argument.
- `notes-workspace.tsx`: stops creating a browser Supabase client via
  `createClient()` for data purposes and stops passing `supabase` to any
  hook. (The browser client stays in use elsewhere — login/signup/logout
  forms — untouched by this change.)
- `use-notes.ts`, `use-collections.ts`, `use-tags.ts`, `use-search.ts`:
  drop the `supabase: SupabaseClient` parameter; import and call the
  corresponding Server Actions instead of `db.ts` functions directly.
  Debounce timers, optimistic `setState` calls, and the
  `try { await x() } catch { onError(...) }` error-handling shape are
  unchanged.

### Bundled fixes

- `app/auth/confirm/route.ts`: wrap `error.message` in
  `encodeURIComponent()` before interpolating into the `/auth/error`
  redirect URL.
- `package.json`: bump `eslint-config-next` off the stale `15.3.1` pin to
  match the installed Next.js 16 line.

## Testing

- `npx tsc --noEmit` and `npx eslint` on every changed file.
- Manual smoke test in browser (this touches every read and mutation path
  in the notes app): create a note, edit it (autosave), delete it, rename
  a collection, add a new tag to a note, add an existing tag, remove a
  tag, search notes.

## Risks

- This is a broad-surface change (every hook, the DAL, 3 new action
  files) landing in one pass on a working app. Mitigated by keeping each
  action a thin, easily-diffable delegator to already-reviewed DAL logic,
  and by the manual smoke test before committing.
- Server Actions add one network hop (client → Next.js server → Supabase)
  versus today's direct client → Supabase call. Given Supabase Auth
  session validation already happens server-side in the proxy on every
  request, and the app is a personal single-tenant notes tool, this
  latency tradeoff is acceptable for the security gain.
