# CLAUDE.md — Bookmarks App (Mid-Sprint Project)

A minimal, provably secure multi-user bookmarks manager. Next.js (App
Router) + TypeScript + Tailwind + Supabase.

## Non-Negotiable Rules

1. **All database reads and writes go through `app/lib/db.ts`.** No
   component, page, or route handler may call `supabase` directly.
2. **All writes happen via Next.js Server Actions**, never a client
   component calling Supabase directly. Client-side "ownership checks"
   are bypassable and add nothing beyond RLS — server-side + RLS is the
   only real protection.
3. Every signed-in-only route verifies the session server-side
   (`supabase.auth.getUser()`) before rendering — never rely on the
   client-side session alone.
4. RLS is enabled on every table, with a policy per operation pinned to
   the `authenticated` role.
5. Schema changes are Supabase CLI migrations under `supabase/migrations/`
   only — never a manual dashboard edit with no matching migration file.
6. Scope is fixed: save (URL + manual title), list, delete. No tags, no
   edit, no server-side title auto-fetch.

## Testing

Use the CLI for one-off tasks. Use MCP when the agent needs to repeat or
react to what's on screen.

- `npx playwright test` (CLI) — run the e2e suite before and after every change.
- Playwright MCP — live browser control, for exploring behaviour that
  doesn't have a test yet or confirming a freshly built feature actually
  renders/works.

## Git Workflow

- `main` — stable.
- This is a small, single-contributor mid-sprint project; direct commits
  to `main` are fine (no PR-per-task requirement, unlike `part1/`'s
  optional tasks).
