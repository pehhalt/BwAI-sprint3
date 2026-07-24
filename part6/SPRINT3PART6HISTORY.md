# Planning and execution history — Sprint 3, Part 6 (AI Chatbot with Memory)

## Status: skipped for now

Not started. The task and a suggested implementation breakdown were
handed over and turned into `README.md`, but no code was written and no
host app was chosen — deferred purely due to time constraints in this
sprint, not because of any blocker in the task itself. Safe to pick up
later starting from `README.md`.

## What's still an open decision when this is picked back up

The task requires building the chatbot **inside an existing** Next.js +
Supabase application rather than a new standalone one. Two candidates
exist in this repo:

- `part1/`'s notes app — already the host for the part3/part4 lesson work
  (security subagents, Playwright suite), so it already has the shared
  `.claude/agents/`, `.claude/skills/`, and a Playwright setup to extend.
- `mid-sprint-project/`'s bookmarks app — the security-hardened mid-sprint
  deliverable, already deployed to Vercel with its own Supabase project.

Neither has been chosen yet. Whichever is picked, follow its existing
folder conventions and database/auth patterns rather than introducing a
second architecture (per the task's own instruction).

## Source material

- Full task summary and a suggested five-stage implementation breakdown
  were provided directly (not pasted into this file to avoid duplicating
  `README.md`, which already carries the complete breakdown).
- `README.md` in this folder is the canonical reference for scope,
  security rules, prerequisites, required Playwright tests, and the
  definition of done.
