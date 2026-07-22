# What I did in Sprint 3, Part 3

## Exercise: Supabase agent skills + 3 security subagents

Work happens directly against the notes app in `part1/` (no separate app
this time). Shared `.claude/agents/` and `.claude/skills/` already live at
the repo root.

### Prerequisite check

- [x] ~~Confirm `supabase/agent-skills` is already installed~~ — files
      existed at `part1/.agents/skills/` but turned out **not** to be
      discoverable by Claude Code (no `.claude/skills` entry, `/skills`
      picker didn't list them, `Skill` tool returned "Unknown skill").
      That copy was installed under a different part's project scope
      and Claude Code only scans `.claude/skills/` (plus symlinks) from
      wherever the session's working tree root is.
- [x] Open the `/skills` picker and confirm the Supabase skills show as
      enabled — confirmed after the reinstall below (`supabase`,
      `supabase-postgres-best-practices` both listed, plus
      `supabase-security`, the pre-existing custom one)

### Step 1 — Feature branch

- [x] `git checkout -b security-audit` (single repo shared across
      part1/part2/part3 — one `.git` at the root, no separate repo per
      part)

### Step 2 — Supabase skills

- [x] `npx skills add supabase/agent-skills`, run from the repo root
      (`sprint3/`) — installed to `.agents/skills/supabase` and
      `.agents/skills/supabase-postgres-best-practices`, symlinked into
      `.claude/skills/` (Claude Code's actual discovery path)
- [x] `/reload-plugins` + `/skills` — both skills now show as loadable
- [ ] Optional cleanup: `part1/.agents/skills/{supabase,supabase-postgres-best-practices}`
      is now an orphaned duplicate of the old, non-discoverable install
      — safe to delete later, not touched yet

### Step 3 — Build `supabase-security-scanner`

- [x] Create subagent `supabase-security-scanner`
      (`.claude/agents/supabase-security-scanner.md`), with `supabase`
      and `supabase-postgres-best-practices` listed in its `skills`
      frontmatter (preloaded every run)
- [x] Checks for: RLS disabled on any table, incomplete policies (e.g.
      UPDATE without matching SELECT), `service_role` key exposure,
      public storage buckets, policies trusting user-editable data
      (`user_metadata` instead of `app_metadata`), `security_invoker`
      missing on views
- [x] Findings only, grouped critical/high/medium — no edits

### Step 4 — Dispatch the Supabase scanner

- [x] Dispatched `supabase-security-scanner` against `part1/` — result:
      **0 critical, 0 high, 1 medium**
- [x] Read the finding rather than stopping at "0 critical, 0 high":
      medium was `part1/package.json` pinning `@supabase/ssr`,
      `@supabase/supabase-js`, and `next` to `"latest"` (supply-chain
      pinning rule from the `supabase` skill) — everything else (RLS on
      all 4 tables, ownership-consistent policies, no `service_role`
      exposure, no storage buckets, no `user_metadata`-based auth, no
      views) came back clean

### Step 5 — Fix Supabase findings

- [x] Fixed the one medium: pinned the 3 packages to their
      currently-locked versions (`^0.12.0`, `^2.108.2`, `^16.2.9`),
      confirmed via `npm install` that the lockfile only picked up that
      change (+ unrelated npm-internal `peer` field/`name` cleanup, not
      introduced by the fix) — no RLS/policy/storage changes this round,
      so no dashboard verification needed
- [x] Committed (`dc2be0e`, on `security-audit`)

### Step 6 — Clear context, rescan (Supabase)

- [x] `/clear`, re-dispatched `supabase-security-scanner` fresh — result:
      **0 critical, 0 high, 0 medium**
- [x] Confirmed clean in the fresh context — it independently re-verified
      the package.json pinning fix (no memory of the earlier fix, just
      found current state clean) and every other category from Step 4,
      cross-referenced `part1/docs/` audit history, no regressions from
      the two newest migrations

### Step 7 — Build + run `nextjs-security-scanner`

- [x] Create subagent (`.claude/agents/nextjs-security-scanner.md`),
      seeded with the full content of
      `https://nextjs.org/docs/app/guides/data-security` (fetched and
      embedded directly in the agent file — no installable official
      skill exists for this one, unlike Supabase)
- [x] Checks for: secrets behind `NEXT_PUBLIC_`, full DB records/objects
      passed into client components, server actions skipping
      re-auth/ownership checks, "logged in" checks standing in for
      "owns this record" checks (IDOR), scattered data-access logic,
      unvalidated client input, leaky Server Action return values,
      `proxy.ts`/`route.ts` scrutiny, unvalidated `/[param]/` routes
- [x] Dispatched `nextjs-security-scanner` against `part1/` — result:
      **0 critical, 1 high (architectural), 3 medium, 4 low**
      - High: `app/lib/db.ts` had no app-layer authorization — every
        query/mutation relied solely on RLS, no defense-in-depth
      - Medium: over-fetching (`select("*")` leaking `user_id` etc. to
        client components), `db.ts` not an isolated DAL, `collection_id`
        accepted from client with no ownership check
      - Low: dead `/login` exclusion in `proxy.ts`, `NEXT_PUBLIC_` keys
        (expected/fine), no rate limiting, dynamic routes/route
        handlers reviewed clean
- [x] Fixed high + 2 related mediums together in `app/lib/db.ts`
      (`90dcaa5`): added `requireUserId()` + explicit `user_id` scoping
      on every notes/collections/tags query and mutation, ownership
      checks before linking a note to a collection or tag, explicit
      column lists instead of `select("*")`. Verified: `tsc --noEmit`
      and `eslint` clean, dev server boots, **user manually smoke-tested
      create/edit/delete note, rename collection, add/remove tag in
      browser — confirmed working**
- [x] Fixed the dead-code low finding in `proxy.ts` (`1987f26`)
- [x] Clear context, rescan to confirm — result: **0 critical, 1 high
      (architectural), 4 medium, 5 low**. The High was a real, important
      catch: the `requireUserId`/ownership checks added above still ran
      **client-side** (`db.ts` was imported by `"use client"` hooks), so
      they only guarded against this app's own bugs, not a malicious
      client — RLS remained the only real boundary, unchanged from
      before that "fix." See the migration below.

### Step 7 rescan → Server Actions migration

The High finding above led to a full architecture change rather than a
small patch — brainstormed, designed, planned, and executed via
subagent-driven development (8 tasks, each with an independent
implementer + reviewer subagent):

- [x] Design spec: `part1/docs/superpowers/specs/2026-07-22-server-actions-migration-design.md`
- [x] Implementation plan: `part1/docs/superpowers/plans/2026-07-22-server-actions-migration.md`
- [x] `app/lib/db.ts` rewritten as a true `server-only` Data Access
      Layer (no more browser-passed `SupabaseClient` — every function
      creates its own server client and does its own auth check)
- [x] Three new `"use server"` action files (`app/actions/notes.ts`,
      `collections.ts`, `tags.ts`) thinly delegating to the DAL
- [x] All 4 hooks + the Server Component loader + `notes-workspace.tsx`
      migrated to call the actions instead of touching Supabase directly
      from the browser
- [x] Bundled fixes along the way: unencoded error message in
      `app/auth/confirm/route.ts`; `eslint-config-next` bumped off a
      stale `15.3.1` pin — which turned out to also be silently broken
      (`FlatCompat` incompatible with the new native flat-config export,
      crashed with a circular-reference error) and needed a real fix,
      caught and corrected mid-implementation via its own review round
- [x] Every task independently reviewed for spec compliance + code
      quality; a final whole-branch review (Opus) confirmed **ready to
      merge**, no Critical/Important issues
- [x] One Minor finding applied as a fast-follow: `getCurrentUserId`'s
      `cache()` wasn't actually deduping (kept a `SupabaseClient`
      argument as its cache key, which differed per caller) — fixed to
      take no argument, human-verified working afterward
- [x] Human manually smoke-tested the full flow (create/edit/delete
      note, rename collection, add/remove tags, search) twice — once
      after the migration, once after the fast-follow fix

### Step 8 — Build + run `vercel-security-scanner`

Not started this session — the notes app isn't deployed to Vercel yet,
and several of this scanner's checks (env var scoping, Deployment
Protection, live security headers) can't be meaningfully audited
pre-deploy. Deferred, tracked as its own future step.

- [ ] **Decide/confirm**: does this require deploying `part1/` to Vercel
      first? (Env var scoping, Sensitive flag, Deployment Protection,
      and live security headers can't be audited pre-deploy.)
- [ ] If deploying: import `part1/` into Vercel (Root Directory =
      `part1`), set `NEXT_PUBLIC_SUPABASE_URL` /
      `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, confirm Google OAuth
      redirect URLs updated for the new domain
- [ ] Create subagent (no official skill exists for this one — built
      from the lesson's risk list directly)
- [ ] Checks for: env var scoping (Production/Preview/Development) +
      Sensitive flag, Deployment Protection on preview URLs, security
      headers (CSP, X-Frame-Options, X-Content-Type-Options) actually
      deployed, signs of a previously-leaked/unrotated secret
- [ ] Dispatch `@vercel-security-scanner`, fix, clear context, rescan

### Step 9 — Wrap up

- [x] Committed remaining changes (skills install, both subagents, plan
      doc, this write-up)
- [x] Pushed `security-audit`, opened PR

Vercel scanner (Step 8) and the combined `/security-scan` commands
below are still open — this PR covers the Supabase + Next.js scanner
work only.

## Combined slash commands (efficiency pass)

- [ ] Create `/security-scan` (`.claude/commands/security-scan.md`) —
      runs all 3 scanners in parallel, merges into one severity-grouped
      report, de-duping findings flagged by multiple scanners
- [ ] Create `/security-scan-changed`
      (`.claude/commands/security-scan-changed.md`) — same, but scoped
      to files changed vs. `main` only (day-to-day/PR use;
      `/security-scan` reserved for periodic full-codebase runs)

## Vercel deployment-gating + defence-in-depth (post-deploy, if deployed)

- [ ] Turn off auto-deploy: add `git.deploymentEnabled: false` to
      `part1/vercel.json` (or scope to specific branches), confirm
      manual deploy via dashboard or `vercel --prod`
- [ ] Defence-in-depth sweep: for every form/button/API call that
      changes data, confirm the server-side handler re-checks both
      "is a user signed in" and "does this user own this specific
      record" — flag any that only check the former
- [ ] Post-deploy sweep: logging doesn't write secrets/PII, source maps
      disabled or Protected Source Maps enabled, `next.config.js` image
      domains restricted (no wildcard), no caching of pages containing
      a signed-in user's private data
- [ ] Optional: enable Attack Challenge Mode toggle location documented
- [ ] Optional: add a Vercel Firewall rate-limit rule if a public API
      endpoint exists

## Notes / decisions log

- The prerequisite check ("is `supabase/agent-skills` already
  installed?") looked satisfied by file existence alone, but wasn't —
  the earlier install lived at `part1/.agents/skills/`, a location
  Claude Code's own skill discovery never scans. Lesson: file existence
  isn't the same as tool discoverability; had to actually test with the
  `Skill` tool to catch it.
- `/reload-plugins` is needed after adding a new skill *or* a new
  subagent file — the running session caches both lists at startup.
- A version-pin fix (`eslint-config-next` 15.3.1 → 16.2.9) silently
  broke `npx eslint` entirely (circular-reference crash from the old
  `FlatCompat` pattern meeting the new native flat-config export). Fixed
  via `eslint.config.mjs`, but the first fix attempt (bare index import)
  itself silently dropped the full typescript-eslint ruleset — caught
  by a task reviewer, not by the original implementer. Two review
  rounds on what looked like a two-line lint-config fix.
- The Next.js scanner's fresh-context rescan didn't just re-confirm the
  earlier fix — it correctly identified that the "defense-in-depth"
  comment on that fix was false (client-executed checks add no
  protection against a malicious client), which is exactly the
  fresh-context-catches-things-a-carried-context-would-rationalize-away
  behavior this lesson warns about.
- `part1/.agents/skills/{supabase,supabase-postgres-best-practices}` is
  still an orphaned duplicate from the original (non-discoverable)
  install — not cleaned up this session, safe to remove later.
- On Windows with `core.symlinks=false`, `git add` on the
  `.claude/skills/supabase*` symlinks (created by `npx skills add`)
  dereferenced them into full duplicate copies instead of storing a
  symlink — caught before committing, gitignored instead with a comment
  explaining why (see root `.gitignore`).
