# What happened before the plan was written — Mid-Sprint Project

This isn't a `partN` lesson write-up like `part2`–`part4`'s history files —
it's the planning log for the mid-sprint deliverable itself, kept for the
same reason: so a fresh session can see what was already decided without
re-reading the whole conversation.

## Task received

Full verbatim task pasted by the user: "Mid-Sprint Project: Ship a Secured
App and Prove It." Saved in full at
[`docs/superpowers/specs/2026-07-23-mid-sprint-task.md`](docs/superpowers/specs/2026-07-23-mid-sprint-task.md).

## Decisions made, in order

- [x] **Where should this project live?** Considered: new folder in the
      existing `BwAI-sprint3` repo vs. a separate new GitHub repo (like
      `part2`'s `vercel-deploy-lab`). Chose **new folder in this repo**,
      specifically because `ai-architect`, all three security scanners,
      `/security-scan`, and the Supabase skills are already committed at
      this repo's root — a separate repo would mean rebuilding or copying
      all of that first.
- [x] **Folder name:** `mid-sprint-project/` — named after the course
      deliverable itself (not `part5/`, since this isn't part of the linear
      part1→part5 lesson sequence; not named after the app, since the domain
      was still undecided at the time).
- [x] **Domain:** offered bookmarks manager / expense tracker / habit
      tracker / "something else." User picked **bookmarks manager**.
- [x] **Scope, after user pushback:** initial proposal included tags
      (junction table or array column). User pointed out the task only
      requires "per-user private data," not any particular feature set, and
      asked to keep this as minimal as possible. Dropped tags entirely.
      Trimmed to the smallest scope that still proves the security story:
      **save (URL + manual title), list, delete. No tags, no edit.**

## `ai-architect` consult (required by the task, done before any code)

Dispatched with the full context: bookmarks domain, this repo's existing
tooling, the hard requirements (multi-user, RLS, migrations, Vercel secrets
scoping, Playwright per feature, fresh-context rescan). Full proposal:

- **Data model:** originally proposed 3 tables (`bookmarks`, `tags`,
  `bookmark_tags` junction) — since superseded by the no-tags scope trim
  above, so only `bookmarks` (id, user_id, url, title, created_at) remains.
- **Junction-table warning (now moot, but worth remembering):** flagged that
  a bookmark↔tag junction table needs an RLS policy checking ownership on
  *both* sides on every operation — the exact bug class `part1/` already hit
  once (`part1/supabase/migrations/20260708130000_harden_tags_and_note_tags_rls.sql`,
  a policy that checked only one side). Relevant again if tags are ever
  added back later.
- **Build order:** deploy auth + a gated empty page first, then save+list,
  then edit+delete, then extras — deploy early, auth from day one. Adapted
  into the plan's task order (auth deploys in Task 4, before save/list/delete
  exist).
- **Weak points flagged:**
  - Don't auto-derive a bookmark's title by fetching the target URL
    server-side — invites SSRF and an unauthenticated fetch route. Titles
    are manual in the plan.
  - Watch for any `SECURITY DEFINER` view/RPC silently bypassing RLS — none
    is used in the trimmed scope.
- **Housekeeping catch:** `/security-scan` and all three scanner subagents
  are hardcoded to assume `part1/` is the app under review. Must be
  repointed at `mid-sprint-project/` before the final scan, or it will
  silently scan the wrong app and report a false "clean." This became
  **Task 9** in the plan.

## Plan written

Full 11-task implementation plan written via `superpowers:writing-plans`,
saved at
[`docs/superpowers/plans/2026-07-23-bookmarks-app.md`](docs/superpowers/plans/2026-07-23-bookmarks-app.md).
Covers: scaffold → Supabase project + client helpers → auth flow (with its
own Playwright test) → first deploy → RLS migration → save/list → delete →
redeploy + re-verify → repoint `/security-scan` for a two-app repo → run the
scan and fix findings → fresh-context rescan + `REFLECTION.md`.

## Execution approach chosen

**Subagent-driven** (`superpowers:subagent-driven-development`) — a fresh
subagent per task, with review between tasks. Not yet started (deliberately
paused here to resume fresh tomorrow).

## Notes / decisions log

Nothing built yet as of this entry — no `create-next-app`, no Supabase
project, no commits beyond these planning docs. Task 1 of the plan is the
next action.

## Incident: Task 1 scaffold deleted this docs/ folder and README.md

`npx create-next-app@latest mid-sprint-project ...` was run against this
already-existing, non-empty directory (it contained this history file, the
spec, the plan, and a docs-pointer `README.md` — all still untracked in
git at that point). The scaffold silently wiped `docs/` and overwrote
`README.md` with the default Next.js template rather than refusing to run
against a non-empty directory. None of it was in git history yet (all
untracked), so nothing was recoverable via git — these four files were
reconstructed from the conversation transcript that had read them in full
immediately beforehand.

**Lesson for future tasks/plans in this repo:** before scaffolding a new
app with `create-next-app` (or any generator that assumes an empty
target), either commit any existing untracked files in that directory
first, or scaffold into a temp directory and move the generated files in
— never run the generator directly over a directory holding not-yet-committed
planning docs.
