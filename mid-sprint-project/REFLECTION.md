# Reflection — Bookmarks App

Live URL: https://mid-sprint-project.vercel.app

## Security scan history

- First full `/security-scan`: 2026-07-23 — 6 findings (0 critical, 2 high, 4 medium, 5 low)
  - High: no application-level ownership checks in `app/lib/db.ts` (RLS-only single point of failure); no security headers combined with an unsanitized bookmark URL rendered as a raw `href` (self-XSS risk via `javascript:` URI)
  - Medium: Vercel env vars scoped to Production only, not Preview/Development; `app/lib/db.ts` missing a `server-only` guard; signup error message enabled email enumeration; no application-level rate limiting on login/signup
  - Low (deliberately deferred — inert/informational, not required by the task spec): missing `UPDATE` policy on `bookmarks` (no edit feature exists); default Postgres GRANTs to `anon`/`authenticated` remain on the table (RLS already fully blocks `anon`); silent no-op when deleting a nonexistent/foreign bookmark id; no format validation on bookmark `id` before it reaches the DB; Preview-deployment protection inferred but not directly tested
- Fixes committed:
  - `72faeea` — High findings: explicit `user_id` ownership checks in `app/lib/db.ts` (defense-in-depth on top of RLS, not a replacement), security headers (`CSP`/`X-Frame-Options`/`X-Content-Type-Options`) in `next.config.ts`, URL scheme allow-list (`http`/`https` only) in `createBookmarkAction`
  - `03792ce` — Medium findings: `server-only` guard on `app/lib/db.ts`, generalized signup error message for the "already registered" case, in-process per-email rate limiter (5 attempts/60s) on signup and login with documented cross-instance limitation, Vercel env vars added to Preview and Development scopes (dashboard-only, no commit)
- Second full `/security-scan` (same session as a preceding fix, so this does **not** count as the Task 11 fresh-context rescan — see below): 2026-07-23/24 — run after adding bookmark rate limiting (`cf4f30a`) and after discovering the Task 10 header fix had never actually been deployed (the two live Vercel deployments predated the commit that added `next.config.ts`'s `headers()`; a fresh `vercel --prod` deploy fixed that). Findings: 0 critical, 0 high, 2 medium (CSP `script-src 'unsafe-inline'`; Vercel env vars not marked "Sensitive" — later found to be a Vercel platform limitation on Development, not a real gap), 6 low (caret-pinned Supabase deps, in-memory rate limiter's documented per-instance limitation, no length/format validation on bookmark fields, missing `Referrer-Policy`/`Permissions-Policy` headers, Preview-protection still unverified).
  - Fixes committed: `090039e` — `Referrer-Policy`/`Permissions-Policy` headers, max-length checks on bookmark `title`/`url`, UUID-format check on `id`. CSP `unsafe-inline` and the in-memory rate limiter were left as documented trade-offs, not fixed.
  - `71cdbce` (UI restyle, not security) and a `next.config.ts` change allowing `'unsafe-eval'` only outside production (clears a dev-mode console warning, doesn't touch the production CSP) landed after this scan and were never rescanned.
- Fresh-context rescan (Task 11, still required): **not yet done.** The scan above ran in the same session as the fixes it was checking, and more commits (`090039e`, `71cdbce`) landed afterward — per the plan's explicit warning, only a scan run in a genuinely new session, with nothing done first, counts. This must still happen, covering everything through `71cdbce`.

## Review checklist

- [x] ai-architect consulted on the structure before any feature was built
- [x] App deployed at a live Vercel URL; verified in an incognito window as a brand-new visitor
- [x] Sign-up, log-in, log-out all work; signed-out visitors cannot reach `/bookmarks` (verified both via the UI and by typing the URL directly)
- [x] `bookmarks` has RLS enabled and three owner-scoped policies, confirmed in the dashboard under Authentication > Policies
- [ ] Full `/security-scan` run after build + deploy; fixes applied; clean rescan confirmed in a fresh context — **two scans run and fixes applied/reviewed; the required fresh-context rescan is still pending (must run in a new Claude Code session that hasn't made any fixes itself — see history above)**
- [x] `.env.local` not committed; no service role key in any `NEXT_PUBLIC_` variable or in the repository
