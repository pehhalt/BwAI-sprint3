# Planning and execution history — Mid-Sprint Project

This isn't a `partN` lesson write-up like `part2`–`part4`'s history files —
it's the planning and build log for the mid-sprint deliverable itself, kept
for the same reason: so a fresh session can see what was already decided
and what actually happened without re-reading the whole conversation. The
first half covers planning (before any code existed); the "Execution
summary" section near the end covers the build itself, Tasks 1–10.

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
subagent per task, with review between tasks (spec compliance + code
quality), executed continuously through Task 10 in one later session. Task
11 (the fresh-context rescan) is deliberately left for a separate session,
per the plan's own requirement.

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

## Execution summary (Tasks 1–10 complete)

All ten build tasks ran via `superpowers:subagent-driven-development` — a
fresh implementer subagent per task, then a fresh reviewer subagent
grading spec compliance and code quality, with fix-and-re-review loops
where needed. Full per-task detail (commits, reviewer verdicts, evidence)
lives in the session's progress ledger; this is the condensed version.

**Tasks 1–8 (scaffold through redeploy+reverify):** all approved on first
or second pass, no unresolved Critical/Important findings. Notable events:

- **Task 1 incident:** as described above — `create-next-app` deleted the
  pre-existing `docs/`, `README.md`, and this file; recovered from the
  conversation transcript and committed separately.
- **Task 2 commit-hygiene bug:** `npm install`'s `package.json`/
  `package-lock.json` changes were left uncommitted because the plan's own
  `git add` command for that step didn't list them — caught by the task
  reviewer, fixed directly by the controller. The same bug class was
  explicitly watched for in every later task that ran `npm install`
  (Task 3's Playwright init, Task 10's `server-only` install) and did not
  recur.
- **Task 3 live-Supabase blockers:** the plan's test hardcodes
  `...@example.com`, which Supabase rejects as a reserved test domain —
  fixed by swapping only the domain to `@test-mid-sprint.dev` (human-approved,
  no assertions touched), reused consistently in every later test file.
  Separately, "Confirm email" was still on in the Supabase dashboard despite
  being turned off earlier — user re-checked and fixed it, verified via the
  Auth API (`mailer_autoconfirm: true`).
- **Tasks 4–5 (deploy, RLS migration):** Vercel CLI and Supabase CLI were
  authenticated non-interactively (Vercel: already logged in as `pehhalt`;
  Supabase: a human-provided personal access token, `SUPABASE_ACCESS_TOKEN`,
  rather than the interactive browser login the plan's literal text
  describes). Task 5's RLS was independently re-verified by the reviewer via
  live Management API queries (`pg_class.relrowsecurity`, `pg_policies`),
  not just trusted from the implementer's report.
- **Tasks 6–8:** save/list, delete, and the redeploy+incognito-walkthrough
  all passed clean, including independent re-verification against the live
  production URL (curl + Playwright) by both the implementer and the
  reviewer.

**Task 9:** repointed `/security-scan` and `vercel-security-scanner.md` to
ask for/accept a target directory instead of assuming `part1/` — mechanical
text edit, approved clean.

**Task 10 — security scan and fixes:**

Full `/security-scan` (all three scanners in parallel) against
`mid-sprint-project/` found **0 critical**, **2 High**, **4 Medium**, **5
Low**:

- High: no application-level ownership checks in `app/lib/db.ts` (RLS was
  the sole enforcement layer, correctly scoped but a single point of
  failure with no code-level backstop); no security headers configured,
  combined with an unsanitized bookmark URL rendered as a raw `href`
  (self-XSS risk via a `javascript:` URI bookmark, since RLS limits it to
  the attacker's own list).
- Medium: Vercel env vars scoped to Production only, not Preview/
  Development; `app/lib/db.ts` missing a `server-only` build guard; signup
  errors propagated Supabase's raw text, enabling email enumeration; no
  application-level rate limiting on login/signup.
- Low (deliberately deferred, not required by the task spec): missing
  `UPDATE` policy on `bookmarks` (inert — no edit feature exists); default
  Postgres GRANTs to `anon`/`authenticated` remain on the table (RLS
  already fully blocks `anon`, verified); `deleteBookmark` doesn't check
  affected row count (silent no-op deleting a nonexistent/foreign id,
  harmless under RLS); no format validation on the bookmark `id` before it
  reaches the DB; Preview-deployment protection inferred but not directly
  tested (no Preview deployment existed to test against).

Both High findings and, at the user's request, all four Medium findings
were fixed and independently reviewed-approved:

- **High fixes** (commit `72faeea`): explicit `user_id` scoping added to
  every function in `app/lib/db.ts` as defense-in-depth on top of
  untouched RLS (not a replacement); a `headers()` function in
  `next.config.ts` adding CSP/`X-Frame-Options`/`X-Content-Type-Options`;
  an `http`/`https`-only scheme allow-list in `createBookmarkAction`. The
  reviewer independently re-ran the Playwright suite and curled the dev
  server to confirm the headers were real, not just claimed. One
  non-blocking note: the CSP's `script-src 'unsafe-inline'` means the CSP
  itself doesn't actually block `javascript:` URI navigation per spec —
  the real protection against that specific vector is the URL-scheme
  allow-list, not the CSP. Not a live gap (input validation already closes
  it), but worth knowing the CSP isn't a true second layer for that one
  vector.
- **Medium fixes** (commit `03792ce`): `server-only` guard on `db.ts`
  (`npm install`'s manifest changes correctly committed this time); signup
  error generalized only for the "already registered" case (via
  `error.code` plus a message-regex fallback, verified against Supabase's
  actual `AuthError` shape), leaving other genuine errors specific; an
  in-process, per-email rate limiter (5 attempts/60s) on both signup and
  login, with its cross-serverless-instance limitation candidly documented
  in a code comment rather than glossed over; Vercel env vars added to
  Preview and Development scopes (dashboard-only, no commit). The reviewer
  independently wrote and ran temporary Playwright checks against the live
  dev server to verify the enumeration fix and rate limiter, then deleted
  them and confirmed a clean working tree.

**Status as of this entry:** Tasks 1–10 complete and committed on `main`.
Task 11 (fresh-context rescan + `REFLECTION.md`) is the only remaining
step — it must run in a genuinely new Claude Code session per the plan's
explicit warning, so it could not be completed in the same session as the
fixes above.

## Follow-up session: more features, a same-session rescan (not Task 11), and UI polish

A later session (still not the fresh-context rescan required by Task 11)
made three more rounds of changes, all committed to `main`:

- **`cf4f30a` — rate limiting extended to bookmark actions.** The
  `checkRateLimit` helper from `app/auth/actions.ts` was extracted into a
  shared `app/lib/rate-limit.ts` (now parameterized by
  `maxAttempts`/`windowMs` instead of hardcoded module constants) and
  applied to `createBookmarkAction`/`deleteBookmarkAction`, keyed by
  `bookmark:${user.id}` at 20 attempts/60s combined. Requested because the
  original Task 10 scan only rate-limited signup/login, not the
  bookmark-mutating actions.
- **A same-session `/security-scan` re-run** (explicitly *not* a
  substitute for Task 11 — see the warning below) was run after the rate
  limiting change, plus after redeploying to confirm the Task 10 header
  fix had actually gone live (it hadn't: `next.config.ts`'s `headers()`
  predated the two live Vercel deployments, so the fix existed in the repo
  but was never actually serving until a fresh `vercel --prod` deploy).
  This rescan found:
  - Medium: CSP `script-src` allows `'unsafe-inline'` (no nonce/hash
    scheme); Vercel env vars not marked "Sensitive" (later found to be a
    Vercel platform limitation for the Development environment, not a
    real gap — Production/Preview already were).
  - Low: caret-pinned Supabase package versions; the rate limiter's
    documented per-instance limitation; no length/format validation on
    bookmark `title`/`url`/`id`; no `Referrer-Policy`/`Permissions-Policy`
    headers; Preview-deployment protection still unverified (no Preview
    deployment exists to test against).
  - **`090039e` — fixes for the above:** `Referrer-Policy` and
    `Permissions-Policy` headers added to `next.config.ts`; max-length
    checks on bookmark `title`/`url` and a UUID-format check on `id`
    before it reaches `deleteBookmark`, plus matching `maxLength`
    attributes on the form inputs. The CSP `unsafe-inline` and in-memory
    rate-limiter findings were deliberately left as-is (documented
    trade-offs, not gaps — see the scan discussion for why).
- **`71cdbce` — UI restyle (not a security change).** Bookmarks list
  changed from a `<ul>` to a table, inside a single card frame wrapping
  the title/description/form/table (was previously only around the form,
  which visibly overflowed under long URLs — fixed with `min-w-0` on the
  flex inputs); bookmark links show the full URL via a native
  `title`-attribute tooltip; login/signup pages got a title, short
  description, and a matching card frame, sized to a fixed, equal width
  (`w-[26rem]`) so switching between them doesn't shift the layout, wide
  enough for the longer description to stay on one line.
  `next.config.ts`'s CSP was also changed to allow `'unsafe-eval'` in
  `script-src` only when `NODE_ENV !== "production"`, clearing a
  React dev-mode console error (`eval() is not supported...`) without
  weakening the strict production CSP.

**Why none of this satisfies Task 11:** the plan's own warning is explicit
— the rescan "must run in a genuinely new Claude Code session... An agent
that carried the first conversation tends to confirm its own prior work
rather than re-examine the files." The re-run described above happened in
the same session that had just made the rate-limiting change, and the
session then went on to make *more* changes (`090039e`, `71cdbce`)
afterward — so even setting the same-session issue aside, that scan is
now stale against the current code. **Task 11 is still open.** A real
fresh-context rescan still needs to run, covering everything through
`71cdbce`, in a session that has done nothing else first.
