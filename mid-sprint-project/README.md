# Mid-Sprint Project — Secured Bookmarks App

Live URL: https://mid-sprint-project.vercel.app

Status: **plan written, not yet started.** Start here tomorrow.

This is the course's mid-sprint deliverable ("Ship a Secured App and Prove
It") — a small, provably secure, multi-user web app, built and deployed
from scratch. It lives in its own top-level folder in this repo (not
`part1/`'s notes app) so it inherits the repo-root tooling already built and
committed here: `ai-architect`, the three security scanners
(`supabase-security-scanner`, `nextjs-security-scanner`,
`vercel-security-scanner`), `/security-scan`, and the Supabase skills.

## What we're building

A minimal bookmarks manager, deliberately trimmed to the smallest scope that
still proves the security story:

- Save a bookmark (URL + manual title)
- List your bookmarks
- Delete a bookmark
- **No tags, no edit, no server-side title auto-fetch** — cut deliberately to
  keep the RLS/security story as small and clear as possible. (Tags/auto-fetch
  were considered and rejected — see the `ai-architect` proposal recap in
  `SPRINT3-MIDSPRINT-HISTORY.md`.)

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
  the `superpowers:writing-plans` skill.
- **What happened before this plan was written:**
  [`SPRINT3-MIDSPRINT-HISTORY.md`](SPRINT3-MIDSPRINT-HISTORY.md) — the
  `ai-architect` consult and the decisions that shaped the plan (domain,
  folder location, scope trims).

## How to resume tomorrow

1. Open a Claude Code session in this repo.
2. Chosen execution approach: **subagent-driven** (`superpowers:subagent-driven-development`)
   — a fresh subagent per task, with review between tasks.
3. Point it at `docs/superpowers/plans/2026-07-23-bookmarks-app.md` and start
   at **Task 1: Scaffold the Next.js app**.

Nothing has been built yet — no `npx create-next-app` has been run, no
Supabase project exists for this app, and no code exists in this folder
beyond `docs/`. Task 1 is a clean starting point.

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
- **Known housekeeping item baked into the plan (Task 9):** `/security-scan`
  and `vercel-security-scanner` are currently hardcoded to assume `part1/`
  is the only app in this repo. The plan fixes this to ask/accept a target
  directory before the scan is ever run against this project — don't skip
  that task or `/security-scan` will silently audit the wrong app.
