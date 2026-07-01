# Reflection — Part 4 / Sprint 2 Project

## Persistence approach

### The decision

All document data is stored in **Supabase (PostgreSQL)** via `supabase-js`. No data lives in `localStorage`, `sessionStorage`, or any in-browser store.

### Options considered

| Option | Pros | Cons |
|--------|------|------|
| **Supabase (chosen)** | Data survives clearing the browser; accessible from any device; pairs naturally with Supabase Auth so `user_id` scoping and RLS are a single coherent system; no extra sync layer | Requires a network connection; slightly more latency than a local read |
| `localStorage` | Zero latency reads; works offline | Tied to one browser/device; not compatible with auth-based data scoping; the sprint brief explicitly rules it out |
| `IndexedDB` | Larger storage limits than localStorage; structured queries | Same single-device problem; requires a wrapper library (Dexie etc.) for usability; adds complexity without solving multi-device access |
| Custom REST API + database | Full control over the schema and queries | Significant extra infrastructure; Supabase already provides this without the overhead |

### Why Supabase

The app was already using Supabase Auth. Adding document persistence to the same Supabase project meant:

1. **Data scoping comes for free** — Row Level Security policies enforce `auth.uid() = user_id`, so the database itself prevents one user from reading another's documents. No application-level filtering code needed.
2. **One client, one mental model** — `supabase-js` handles both auth sessions and database queries. There is no second library or connection to manage.
3. **Persistence across devices and reloads** — A user can sign in from a different browser and see the same documents. localStorage cannot do this.

The sprint brief also explicitly states: *"localStorage and sessionStorage are not acceptable persistence layers for this project — no document data may live in either, under any circumstances."* Supabase was the natural choice given the existing stack.

---

## Authentication architecture

### Server-side session verification

Every protected page calls `supabase.auth.getUser()` before rendering — not `getSession()` or `getClaims()`. `getUser()` makes a round-trip to the Supabase Auth server to verify the JWT, which means a stolen or expired token is caught at the server before any data query runs. The slower call is worth it: the alternative is trusting a JWT that may have been revoked.

The `@supabase/ssr` package is used for the server-side client so that session cookies are read and refreshed correctly in Next.js Server Components and Route Handlers.

### What `user_id` is never set by the application

A Postgres trigger (`set_user_id`) runs on every `INSERT` to `notes`, `collections`, and `tags` and writes `auth.uid()` directly into the `user_id` column. Application code never passes `user_id` — which means a bug or a malicious client cannot forge ownership. RLS policies then enforce `user_id = auth.uid()` on all reads and writes.

---

## Optional tasks completed

### Loading states (Easy)
`app/protected/page.tsx` already had a `<Suspense>` boundary around `NotesLoader`. The fallback was plain text. Replaced it with `components/notes/notes-skeleton.tsx` — a full-layout skeleton that mirrors the real sidebar and editor using animated grey bars (`animate-pulse`). A large red `Loader2` spinner is centred over the skeleton so it is obvious something is actively loading. A smaller spinner was also added to the login form's submit button so clicking "Login" gives immediate feedback while Supabase authenticates.

### Export to Markdown (Medium)
A download button (`DownloadIcon`) was added to the note toolbar in `components/notes/notes-workspace.tsx`. On click it creates a `Blob` from `# {title}\n\n{body}` with `type: "text/markdown"`, generates a temporary object URL, triggers a browser download as `{title}.md`, then revokes the URL. No server call, no database change, no new state — entirely client-side.

---

## Issues encountered during Part 8

**Next.js 16 router cache serving stale data after user switch** — After logging out and back in as a different user, `router.push("/protected")` served the previous user's notes from the Next.js RSC cache. Fixed by replacing the push with `router.refresh()` + `router.push()`. `refresh()` marks the cache as stale so the next render re-fetches server components with the new session, while `push()` keeps the layout mounted (no full-page tear-down).

**Nav right side flashing during load** — The `AuthButton` server component was streaming in as part of the page, causing the email/logout area to pop in after the notes loaded. Fixed by extracting user display into a small `UserInfo` async server component inside its own `<Suspense>` within the layout, with a pulse placeholder. This resolves independently of and in parallel with the notes Suspense.

**Next.js 16 `cacheComponents` blocking error** — After making the layout async, Next.js complained that uncached data (`getUser()`) was accessed outside `<Suspense>`. The layout itself cannot be inside a Suspense boundary. Solution: keep the layout synchronous, put all dynamic data access inside child components that are individually wrapped in `<Suspense>`. Also added `await connection()` in `NotesLoader` to explicitly opt the page component into dynamic rendering, replacing the incompatible `export const dynamic = "force-dynamic"` segment config.

**`getClaims()` in AuthButton** — The scaffolded `AuthButton` used `supabase.auth.getClaims()` with a comment suggesting `getUser()` was slower. `getClaims()` reads JWT claims locally without server verification — similar in risk to `getSession()`. Replaced with `getUser()` to comply with the sprint requirement that all server-side auth checks use the verified call.

---

## What worked well

- Writing `CLAUDE.md` before the first line of code — particularly the non-negotiable rule that all DB access goes through `app/lib/db.ts`. This gave a single file to audit for security issues and a single place to add validation.
- Running `/security-scan` after the build surfaced three real issues (open redirect, raw error messages, and RLS ownership gaps) that would have been easy to miss.
- The server-side data fetch pattern (`getUser()` → Promise.all for notes/collections/tags/noteTags → pass as props) kept the client component free of loading states and race conditions.

## Issues encountered (Parts 1–7)

See the root-level `REFLECTIONS.md` (Part 5 section) for a full account of blockers hit during the earlier build: RLS policy gaps, `note_tags` join silently returning `null`, missing foreign keys, accidental `node_modules` commit, and the original Next.js `<Suspense>` boundary requirement.
