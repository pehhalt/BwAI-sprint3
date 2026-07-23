# Mid-Sprint Project — Secured Bookmarks App

Live URL: https://mid-sprint-project.vercel.app

Status: **built, deployed, and security-hardened. One step left: the
fresh-context security rescan (Task 11).**

This is the course's mid-sprint deliverable ("Ship a Secured App and Prove
It") — a small, provably secure, multi-user web app, built and deployed
from scratch. It lives in its own top-level folder in this repo (not
`part1/`'s notes app) so it inherits the repo-root tooling already built and
committed here: `ai-architect`, the three security scanners
(`supabase-security-scanner`, `nextjs-security-scanner`,
`vercel-security-scanner`), `/security-scan`, and the Supabase skills.

## What we built

A minimal bookmarks manager, deliberately trimmed to the smallest scope that
still proves the security story:

- Save a bookmark (URL + manual title)
- List your bookmarks
- Delete a bookmark
- **No tags, no edit, no server-side title auto-fetch** — cut deliberately to
  keep the RLS/security story as small and clear as possible. (Tags/auto-fetch
  were considered and rejected — see the `ai-architect` proposal recap in
  `SPRINT3-MIDSPRINT-HISTORY.md`.)

Sign-up, log-in, and log-out all work; a signed-out visitor is blocked from
every protected route server-side (middleware + a per-page `getUser()`
check), including by typing the URL directly. The `bookmarks` table has RLS
enabled with an owner-scoped policy per operation, plus explicit
application-level `user_id` scoping in `app/lib/db.ts` as defense-in-depth
on top of RLS. Security headers (CSP, `X-Frame-Options`,
`X-Content-Type-Options`) are set on every route, bookmark URLs are
scheme-validated (`http`/`https` only) before saving, signup errors are
generalized to avoid email enumeration, and login/signup carry a
best-effort in-process rate limit.

## Where everything is

- **Source task (verbatim):**
  [`docs/superpowers/specs/2026-07-23-mid-sprint-task.md`](docs/superpowers/specs/2026-07-23-mid-sprint-task.md)
  — the actual course requirements, evaluation criteria, and review checklist.
  Treat this as the source of truth if the plan and the spec ever seem to
  disagree.
- **Implementation plan:**
  [`docs/superpowers/plans/2026-07-23-bookmarks-app.md`](docs/superpowers/plans/2026-07-23-bookmarks-app.md)
  — 11 fully-detailed tasks (exact files, exact code, exact commands) from
  scaffolding through the final fresh-context security rescan. Written via
  the `superpowers:writing-plans` skill. Tasks 1–10 are checked off; Task 11
  (fresh-context rescan) is the only one still open.
- **What happened before this plan was written, and during execution:**
  [`SPRINT3-MIDSPRINT-HISTORY.md`](SPRINT3-MIDSPRINT-HISTORY.md) — the
  `ai-architect` consult, the decisions that shaped the plan, and a summary
  of how the build actually went (incidents, security-scan findings, fixes).
- **Final wrap-up:**
  [`REFLECTION.md`](REFLECTION.md) — security scan history and the review
  checklist. Currently a draft: everything is filled in except the
  fresh-context rescan result, which can only be recorded after Task 11 runs
  in a genuinely new session.

## What's left: Task 11 (fresh-context rescan)

Everything through Task 10 is done and committed on `main`: the app is
live, fully featured within scope, and a full `/security-scan` pass found
zero criticals, fixed both High findings and all four Medium findings (see
`SPRINT3-MIDSPRINT-HISTORY.md` for the detailed list). Five Low findings
were deliberately deferred as inert/informational.

What remains is the plan's own hard requirement: the rescan that confirms
those fixes must run in a **genuinely new Claude Code session** — not a
`/clear` in the same terminal, not a continuation of the session that made
the fixes. To finish:

1. Open a new Claude Code session in this repo (or in `mid-sprint-project/`).
2. Run `/security-scan mid-sprint-project/` (or `/security-scan` and answer
   `mid-sprint-project/` when asked which app).
3. If it comes back clean (zero critical/high), fill in `REFLECTION.md`'s
   rescan result and commit it — the project is then complete.
4. If it finds something new, fix it, commit, and rescan again in yet
   another fresh session — a same-session re-check doesn't count.

## Key decisions already made (don't re-litigate these)

- **Folder location:** this repo, new top-level `mid-sprint-project/` folder
  — not a separate GitHub repo, specifically to reuse the scanner subagents,
  `ai-architect`, `/security-scan`, and Supabase skills already committed at
  this repo's root.
- **Domain:** bookmarks manager (chosen over journal/expense-tracker/habit-tracker
  options).
- **Scope:** save/list/delete only. No tags, no edit.
- **Stack:** matches `part1/` — Next.js (App Router) + TypeScript + Tailwind +
  Supabase (`@supabase/ssr`). Own, separate Supabase project — not shared
  with `part1/`.
- **Server Actions only for all writes** — never a client component calling
  Supabase directly. This directly reuses a lesson already learned in
  `part1/` (client-side "ownership checks" were found to be bypassable and
  add nothing beyond RLS — see
  `part1/docs/superpowers/specs/2026-07-22-server-actions-migration-design.md`).
- **`/security-scan` is target-directory aware** (Task 9) — it now asks
  which app to scan (`part1/` or `mid-sprint-project/`) instead of
  defaulting to `part1/` silently.
