# Source task — Mid-Sprint Project: Ship a Secured App and Prove It

Verbatim course task description, saved so the original requirements survive
independently of the derived implementation plan
(`../plans/2026-07-23-bookmarks-app.md`).

## Learning outcomes

By the end of this part, you should be able to:

- Plan and build a multi-user web app, consulting the ai-architect subagent before any code is written
- Apply the scan, fix, clear-context, and rescan loop to the full app to confirm that all three security scanners report zero criticals and highs
- Deploy a live app to Vercel with secrets managed in the dashboard and never committed to the repository
- Write Playwright happy-path tests for your app's core flows as you build each feature

## Overview

This is a mid-sprint project: no peer or expert review. Work through the Review checklist yourself and move on when every item is ticked.

You will design, build, and deploy a small full-stack web app of your own choosing. The headline skill is security: every table locked down with Row Level Security, every secret in the right place, and all three scanners run and rescanned in a fresh context.

The domain is open: pick anything with per-user private data. The requirement is that the app is multi-user, authenticated, deployed to a live URL, and provably secure.

## Task description

Build and deploy a small web app where each signed-in user has their own private data that no other user can see or reach. Good domain ideas: a personal journal, a bookmarks manager, an expense tracker, a habit tracker, a recipe box. Any of these works, and so does an idea of your own.

The app must be:

- Multi-user. Multiple people can sign up independently and each sees only their own data.
- Authenticated. Sign-up, log-in, and log-out all work. A visitor who is not signed in cannot reach any data.
- Deployed. It runs at a live Vercel URL you can open in an incognito window as a brand-new visitor.
- Provably secure. You run all three security scanners, fix what they find, and rescan in a fresh context to confirm.

## Task requirements

- Choose an app with per-user private data. Pick a domain where the core value is data that belongs to the signed-in user and must not be visible to anyone else.
- Plan before building. Consult the ai-architect subagent on the structure and read its proposal before the first feature is built.
- Supabase authentication. The app supports sign-up, log-in, and log-out. A signed-out visitor cannot view, create, edit, or delete any data — not even through a direct URL.
- RLS on every table. Every table in the Supabase project has Row Level Security enabled and at least one owner-scoped policy. "Owner-scoped" means the policy uses the signed-in user's identity to restrict access to that user's own rows only.
- All schema changes as migrations. Schema changes are recorded as migration files so the database structure is reproducible.
- Deployed to Vercel. The app is live at a public Vercel URL. Only the Supabase anon key appears in environment variables — the service role key is never in the dashboard, the repo, or any NEXT_PUBLIC_ variable.
- Live URL verified as a brand-new visitor. Open the live URL in an incognito window and confirm the app loads, requires sign-in, and blocks access to any data before authentication.
- Security scans with a fresh-context rescan. When the app is built and deployed, run the full /security-scan to dispatch all three scanners in parallel and fix every critical and high finding. Then clear the context (or open a fresh Claude Code session) and run /security-scan again. The second full audit must run in a fresh context — never in the same session as the fixes.
- .env.local is git-ignored and never committed. The local secrets file must not appear in the repository history.

## Optional tasks

### Easy

- Vercel Deployment Protection on preview URLs. Enable Deployment Protection in your Vercel project settings so preview deployments are not publicly accessible.
- Security headers configured. Direct the agent to add Content-Security-Policy, X-Frame-Options, and X-Content-Type-Options headers.

### Medium

- Two-user cross-account test. Create a second test user account and attempt to access the first user's data (for example, by guessing a record ID). Confirm the attempt is correctly blocked by RLS.
- Rate limiting on a public endpoint. If your app has a public-facing API route (for example, a contact form or a webhook), add a Vercel Firewall rate-limiting rule for it.

### Hard

- TDD pass on one feature. Choose one feature and follow the test-first approach from the testing lesson: write the Playwright test first, confirm it fails for the right reason (the feature does not exist yet), build the feature, and confirm the test turns green. Do not edit the test once written. Record the red-to-green journey in a REFLECTION.md note.
- Per-user file storage with storage policies. Add file upload (for example, a profile photo or an attachment) using a Supabase storage bucket. Secure the bucket with per-user storage policies so each user can only read and write their own files. Run the supabase-security-scanner against the storage configuration.

## Evaluation criteria

**Technical implementation**

- All nine task requirements working against a live Supabase project and a deployed Vercel URL
- Every table has RLS enabled and at least one owner-scoped policy visible in the Supabase dashboard
- All three scanner rescans report zero criticals and highs in a clean context

**Workflow and process**

- ai-architect consulted before building
- Clean context confirmed before the second scanner run
- .env.local not in the repository; secrets in Vercel dashboard only
- Commit messages are descriptive; no "updates" or "fix stuff"

**Bonus points**

- An optional task completed and documented

## Approach to solving the task

Plan before touching any code. The most common stumble is skipping straight to the build. Open Claude Code, describe the app in plain language, and ask the ai-architect subagent to propose a structure and flag weak points. Read the proposal and approve it before the agent builds anything. If you want a written record, ask the agent to save the plan as a file in the repo (useful, but not required).

Build with auth from day one. Do not build the data features first and bolt authentication on later. Tell the agent from the start that sign-in is required before any data can be reached. Adding auth on top of an existing data layer is significantly harder and produces gaps.

Testing and deployment both work better woven into the build than saved for the end. After each new feature, ask the agent to add a Playwright test for the happy path, rather than leaving tests until the session is long and the agent is more likely to get the assertions wrong. Get the app live on Vercel after the first working feature too: early deployment surfaces environment variable problems before the app is complex, and it builds the habit of verifying the live URL at each step.

Finish with a full security pass. Once the app is built and deployed, run the full /security-scan. Work through findings from critical to low, then commit the fixes. Start a fresh Claude Code session and run /security-scan again: this second audit must be in a fresh context.

> **Warning:** Do not skip the fresh-context rescan. An agent that carried the first conversation tends to confirm its own prior work rather than re-examine the files. A fresh session sees only the current state of the project. Only a clean result from a fresh context is trustworthy.

Common stumbles:

- The live URL works, but anyone with the link can browse other users' data, because tables went live before RLS policies were written.
- The rescan finishes in a few seconds and reports "all clear" with no new findings. That is usually the same session confirming its own patch, not a fresh read of the codebase.

## Review checklist

- ai-architect consulted on the structure before any feature was built, and its proposal read and approved
- App deployed at a live Vercel URL; live URL verified in an incognito window as a brand-new visitor
- Sign-up, log-in, and log-out all work; signed-out visitors cannot reach any protected route or data
- Every table in the Supabase project has RLS enabled and at least one owner-scoped policy, confirmed in the dashboard under Authentication > Policies
- Full /security-scan run after the app is built and deployed; fixes applied; clean rescan confirmed in a fresh context
- .env.local not committed; no service role key in any NEXT_PUBLIC_ variable or in the repository
