---
description: Identify files changed vs main, then run all three security scanners scoped to just those files, merged into one severity-grouped report
---

Run a security audit scoped to only what's changed on the current branch —
faster and cheaper than `/security-scan`, meant for day-to-day/PR use.

1. Identify the changed files for `part1/` (or wherever the app under
   review lives, if this repo's layout differs later):
   - `git diff --name-only main...HEAD` — committed changes since this
     branch diverged from `main`
   - `git status --short` — anything staged or still uncommitted
   Combine both lists into one set of changed file paths. If the set is
   empty (e.g. you're on `main` with nothing changed), say so plainly and
   stop — don't dispatch the scanners against nothing.

2. Dispatch all three scanner subagents in parallel — a single message
   with three Agent tool calls, not three separate messages. Give each
   the changed-file list and tell it to focus only on those files (and
   anything they directly reference — e.g. a changed hook that calls a
   DAL function still requires reading the DAL function's current code
   to judge it, even if the DAL file itself didn't change) rather than
   re-scanning the whole codebase:
   - `supabase-security-scanner` — RLS gaps, policy gaps, key exposure,
     storage buckets, scoped to the changed files
   - `nextjs-security-scanner` — server/client boundary, server-action
     auth, IDOR risk, scoped to the changed files
   - `vercel-security-scanner` — only relevant if the changed files
     include deployment-relevant config (`next.config.*`, `vercel.json`,
     env-var-related files); if none of the changed files touch anything
     deployment-relevant, have it report that plainly rather than
     re-running a full deployment audit

3. Wait for all three to finish, then combine findings into one report
   grouped by severity: **Critical**, **High**, **Medium**, **Low**.
   Merge duplicate findings flagged by more than one scanner into a
   single entry noting which scanner(s) caught it, same as
   `/security-scan`.

4. Scanners report only — no code changes.
