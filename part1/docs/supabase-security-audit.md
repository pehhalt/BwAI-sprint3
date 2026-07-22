# Supabase Security Audit

Record of building and running the `security-auditor` subagent against this
project, and the fixes that came out of it, ahead of the Sprint 3 Part 2
Vercel deploy.

---

## The subagent + skill pattern

Per the "knowledge in the skill, behavior in the subagent" pattern: the
actual Supabase security reference material lives in
`.claude/skills/supabase-security/SKILL.md` (RLS, publishable/secret key
handling, JWT policies, common pitfalls — views bypassing RLS,
`SECURITY DEFINER` risk, `NEXT_PUBLIC_` env var exposure). The
`.claude/agents/security-auditor.md` subagent itself stays small: it loads
that skill as its reference, searches the codebase for Supabase client
config and env var usage, checks RLS/policy coverage and `SECURITY DEFINER`
usage, and returns a Critical/Warning/Suggestion report. Read-only — it
never edits files.

---

## Round 1: the base migration didn't exist

The first audit's headline finding: the RLS/policy/trigger setup this app's
entire security model depends on existed only in the live Supabase
dashboard and as prose in `docs/supabase-schema.md` — not as a reviewable,
reproducible migration. Fixed by adding
`supabase/migrations/20260601000000_notes_app_schema.sql`, creating
`collections`/`notes`/`tags`/`note_tags`, the `set_user_id()` ownership
trigger, and the `auth.uid()`-scoped RLS policies. Written with
`IF NOT EXISTS` / `DROP ... IF EXISTS` throughout so it's a no-op against
the already-configured live project.

That surfaced a real ordering conflict: the existing seed migration's
`INSERT` had no `user_id`, which the new `NOT NULL` constraint + trigger
would reject on a full `supabase db reset` replay (the trigger
unconditionally overwrites `user_id` with `auth.uid()`, which is `NULL`
outside an authenticated request — a deliberate anti-forgery measure, not a
bug). Fixed by disabling the trigger for just that one insert and
attaching seeded notes to the earliest-created user instead (a no-op, not
an error, on a fresh project with zero users).

## Round 2: re-review of the new migration

A second audit pass — this time reviewing the migration just written —
found two real gaps in it:

1. **`note_tags`'s policy only checked note ownership**, not tag ownership,
   in `WITH CHECK` (and not at all in `USING`). Nothing leaked in practice
   (tag content is separately hidden by `tags`'s own RLS on read), but the
   policy itself didn't enforce that an attached `tag_id` belonged to the
   caller. Tightened so both `USING` and `WITH CHECK` require owning both
   sides of the link.
2. **`set_user_id()` (a `SECURITY DEFINER` function) had no pinned
   `search_path`.** Defense-in-depth per Supabase's own guidance — added
   `set search_path = ''`.

## Round 3: tags.name uniqueness — assumption vs. reality

The audit (and `docs/supabase-schema.md`, and `CLAUDE.md`'s original schema
spec) all assumed `tags.name` had a database-wide `UNIQUE` constraint. In a
multi-tenant app this is a real bug: two different users could never both
have a tag called "work". Before writing a migration to fix it, live
introspection via the Supabase SQL console
(`pg_indexes` / `information_schema.table_constraints` on `tags`) found
**no unique constraint or index on `name` existed at all** — the documented
assumption was simply wrong; the constraint had never actually been
applied. `CLAUDE.md` and `docs/supabase-schema.md` were both corrected, and
`unique (user_id, name)` was added for the first time (after confirming, by
querying, that no duplicate `(user_id, name)` pairs already existed).

Also fixed this round, unrelated to the audit but flagged the same day: a
stale `/notes` path exemption in `lib/supabase/proxy.ts`'s auth check —
left over from a deleted dead route. An earlier audit pass had assumed this
file wasn't wired up at all (looking for the old Next.js `middleware.ts`
convention); it's actually Next.js 16's renamed `proxy.ts`, confirmed
active via the build output (`ƒ Proxy (Middleware)`), so the stale
exemption was a real, live gap.

## Round 4: final pass before the Vercel deploy

One more audit, specifically requested ahead of going live to real users,
surfaced two more low-risk items worth fixing before public use:

1. **`note_tags` had no unique constraint on `(note_id, tag_id)`** — RLS
   still scoped every row to its owner, so not a cross-tenant issue, but
   nothing stopped a duplicate tag-on-note link. Added
   `unique (note_id, tag_id)`.
2. **RLS policies called `auth.uid()` directly** rather than
   `(select auth.uid())`. Same semantics, but wrapping it lets Postgres
   cache the value once per statement instead of re-evaluating it per row —
   a performance recommendation from the project's own skill doc, not a
   security fix.

Also moved the seed migration out of `supabase/migrations/` into
`supabase/seed.sql` — the Supabase CLI's dedicated convention for local-dev
seed data, which runs on `supabase db reset`/`start` but is never pushed to
a remote database via `supabase db push`. As a versioned migration, the old
file could in principle run against any environment those migrations get
replayed on (a fresh staging project, a CI pipeline, etc.), silently
attaching sample notes to whichever real user happened to sign up first
there.

## Round 5: `/security-scan` (part3) — policies not pinned to a role, plus untracked drift

The part3 `supabase-security-scanner` (a different subagent than this doc's
`security-auditor`, built from the official `supabase`/
`supabase-postgres-best-practices` agent skills rather than the hand-written
one) flagged that all 4 RLS policies had no `to authenticated` clause —
they applied to `PUBLIC` (including `anon`) rather than being scoped to the
role they're actually meant for. Not exploitable (every policy's condition
is `(select auth.uid()) = user_id`, and `auth.uid()` is `NULL` for `anon`),
but it relied entirely on that one comparison rather than the database also
refusing to evaluate the policy for `anon` at all.

Fixed in `supabase/migrations/20260723000000_pin_rls_policies_to_authenticated.sql`
(and `20260601000000_notes_app_schema.sql` updated to match, per the usual
pattern). Applied directly via the dashboard SQL Editor rather than
`supabase db push`, since the CLI wasn't authenticated in the session doing
the fix — the exact same SQL either way.

Verifying the fix against live `pg_policies` surfaced something the fix
itself didn't touch: **two extra policies on `notes`** —
`"users can insert their own notes"` and `"users can read their own
notes"` — that don't exist in any migration in this repo. They must
predate this project's migration history rather than having been created
by anything here. Their conditions (`auth.uid() = user_id`) were equivalent
to what `"users own their notes"` already covers, just weaker in form
(`{public}` role, uncached `auth.uid()`), so not a live gap — but untracked
live-database state contradicts this project's whole reason for versioning
RLS in migrations ("reviewable and reproducible from source instead of
living only in the dashboard"). Dropped both, folded into the same
migration. Final state, verified via `pg_policies`: exactly 4 policies
across the 4 tables, one each, all `{authenticated}` — matching source
exactly.

This is the same fresh-context-catches-things-a-carried-context-would-miss
pattern noted elsewhere in this project's history: the fix task was "add
`to authenticated`," not "audit for drift," but checking the live result
rather than trusting the `DDL` "success" message is what caught it.

## A recurring false positive, worth knowing about

Every audit pass flagged "no `.gitignore`, so `.env.local` isn't excluded
from git" as a Suggestion. This is a scope blind spot in how the subagent
was invoked, not a real finding: the auditor only searches inside `part1/`,
but the actual git root is `sprint3/` one level up, where `.gitignore`
already excludes `.env*.local` and `supabase/.temp/` at any depth.
Verified directly each time; no action needed. Worth knowing if this audit
is ever run again — check the real git root before treating that specific
finding as actionable.

---

## Where things ended up

- All four tables (`collections`, `notes`, `tags`, `note_tags`) have RLS
  enabled with ownership-scoped policies.
- `tags.name` is unique per user; `note_tags` has no duplicate links.
- The one `SECURITY DEFINER` function is minimal in scope and has a pinned
  `search_path`.
- No `service_role`/secret key exists anywhere in the codebase — every
  Supabase client uses only the publishable key.
- Seed data lives in `supabase/seed.sql`, outside the migration chain that
  could run against a shared/production database.
- The auth proxy (`lib/supabase/proxy.ts` + root `proxy.ts`) no longer
  exempts a route that doesn't exist.

Final audit pass: no Critical findings, no unaddressed Warnings.
