# Mid-Sprint Project — Secured Bookmarks App

Live URL: https://mid-sprint-project.vercel.app

Status: **complete.** Built, deployed, security-hardened across two scan
passes, and confirmed clean by a fresh-context rescan (Task 11) — zero
critical/high findings.

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
`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) are set
on every route, bookmark URLs are scheme-validated (`http`/`https` only)
and length-checked before saving, signup errors are generalized to avoid
email enumeration, and login/signup **and** bookmark create/delete all
carry a best-effort in-process rate limit (shared implementation in
`app/lib/rate-limit.ts`). The bookmarks list is a table with a native
`title`-attribute tooltip showing the full URL; login/signup/bookmarks
pages all sit inside a bordered card frame.

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
  the `superpowers:writing-plans` skill. All 11 tasks are checked off.
- **What happened before this plan was written, and during execution:**
  [`SPRINT3-MIDSPRINT-HISTORY.md`](SPRINT3-MIDSPRINT-HISTORY.md) — the
  `ai-architect` consult, the decisions that shaped the plan, and a summary
  of how the build actually went (incidents, security-scan findings, fixes).
- **Final wrap-up:**
  [`REFLECTION.md`](REFLECTION.md) — security scan history, including the
  fresh-context rescan result, and the fully-checked review checklist.

## Task 11 (fresh-context rescan): done

Everything through Task 10 was done and committed on `main`, then a second
round of work added bookmark-action rate limiting, ran a second full
`/security-scan`, fixed what it found (missing headers, input validation),
and did a UI restyle — see `SPRINT3-MIDSPRINT-HISTORY.md` for the detailed
list of both scan passes and every fix commit. That second scan ran in the
same session as the fixes it checked, so per the plan's own warning it
didn't satisfy Task 11 on its own.

The actual fresh-context rescan was then run via a freshly-dispatched
agent with zero memory of the fix conversation — the closest available
equivalent to "a genuinely new Claude Code session" from within a running
session (see `SPRINT3-MIDSPRINT-HISTORY.md` for the one methodological
caveat: it worked through each scanner's checklist directly rather than
dispatching three separate sub-agents, since it had no ability to spawn
further agents itself). **Result: 0 critical, 0 high, 5 informational low
findings** — see `REFLECTION.md` for the full list and independent
re-verification of RLS, ownership checks, live security headers, and
Vercel deployment protection.

## Vercel Deployment Protection

Confirmed on — checked directly against the Vercel API (`GET
/v9/projects/{id}`), not just inferred from a redirect: `ssoProtection.
deploymentType` is `all_except_custom_domains`. That means Vercel
Authentication (SSO) gates every deployment URL — production-deployment
URLs, preview deployments, everything — except the actual custom
domain/alias (`mid-sprint-project.vercel.app`), which is intentionally
left public so real users can reach the live app. No `trustedIps`
allowlist or `protectionBypass` token is configured to weaken it. This
already covers the optional "Deployment Protection on preview URLs" task —
there's no separate per-environment toggle to also enable, since this one
setting already applies uniformly across all deployment types.

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
