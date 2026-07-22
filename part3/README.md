# Sprint 3, Part 3 — Security Subagents

This folder holds the write-up for the "Supabase agent skills" / security
subagents exercise. Unlike `part2/`, there's no separate throwaway app here —
the work happens directly against the notes app at `part1/`, using the
shared `.claude/agents/` and `.claude/skills/` at the repo root (they're
already shared across `part1`/`part2`/`part3` since the last part2 commit
moved them up to the repo root).

## What this covers

Building three narrow, single-purpose audit subagents — each with its own
fresh context and its own seeded reference material — rather than one agent
asked to check everything at once:

- **`supabase-security-scanner`** — RLS gaps, policy gaps, leaked
  `service_role` keys, public storage buckets. Seeded with the official
  `supabase` and `supabase-postgres-best-practices` skills (the
  `supabase/agent-skills` package).
- **`nextjs-security-scanner`** — data crossing the server/client boundary,
  server actions that skip re-checking auth, IDOR risk. Seeded with the
  official Next.js data-security guide.
- **`vercel-security-scanner`** — deployment-layer config: env var scoping,
  Sensitive flag, preview deployment protection, security headers. No
  official skill exists for this one; built from the risk list in the
  lesson itself.

Then: run each scanner, fix findings highest-severity first, clear context,
rescan to confirm — and eventually combine all three into `/security-scan`
and `/security-scan-changed` slash commands that run them in parallel.

**What actually happened:** the Supabase scanner found one dependency-pinning
issue, fixed in one pass. The Next.js scanner's *rescan* (fresh context)
caught something more interesting — an earlier fix's "defense-in-depth"
ownership checks in `app/lib/db.ts` executed client-side and were therefore
bypassable, adding no real protection beyond Postgres RLS. That became a full
migration of the notes/collections/tags data layer to genuine Server Actions,
designed and planned properly (see
[`part1/docs/superpowers/specs/2026-07-22-server-actions-migration-design.md`](../part1/docs/superpowers/specs/2026-07-22-server-actions-migration-design.md)
and
[`part1/docs/superpowers/plans/2026-07-22-server-actions-migration.md`](../part1/docs/superpowers/plans/2026-07-22-server-actions-migration.md)),
then executed task-by-task with an independent reviewer subagent per task
plus a final whole-branch review. The Vercel scanner and the combined
`/security-scan` commands are still open — see
[`SPRINT3PART3HISTORY.md`](./SPRINT3PART3HISTORY.md) for the full
step-by-step account, including the surprises along the way.

## Already in place before this lesson started

- **`supabase/agent-skills` is already installed** — found at
  `part1/.agents/skills/supabase` and
  `part1/.agents/skills/supabase-postgres-best-practices` (confirmed via
  their `SKILL.md`/`CHANGELOG.md`, `author: supabase`, pulled from
  `github.com/supabase/agent-skills`). No need to re-run
  `npx skills add supabase/agent-skills`.
- **A different, pre-existing `security-auditor` subagent** already lives at
  `.claude/agents/security-auditor.md` (repo root), built during part1's
  Supabase security audit. It uses a hand-written custom skill
  (`.claude/skills/supabase-security/`), **not** the official package. This
  lesson's `supabase-security-scanner` is a new, separate subagent that
  loads the *official* skills instead — keep both, don't merge or
  overwrite `security-auditor`.

## Open dependency: the notes app isn't on Vercel yet

Part2 only deployed a throwaway scaffold app (`vercel-deploy-lab`), never
`part1/` itself. Several `vercel-security-scanner` checks (env var scoping,
Sensitive flag, Deployment Protection, security headers on a live
deployment) can't be meaningfully audited until the notes app is actually
deployed. That may mean deploying `part1/` to Vercel as part of this lesson
— tracked as its own step in the history file rather than assumed.
