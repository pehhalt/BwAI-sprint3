# Implementation Plan

## Goal

Ship a secure MVP in approximately 2.5 days, local-first. Mandatory requirements take precedence over optional features. Use focused tests and avoid repeated browser-driven debugging. Deployment is a stretch goal, attempted only once everything else is solid.

## Time budget

- Day 1: setup, authentication, schema, RLS, basic CRUD
- Day 2: OpenRouter rewrite flow, persistence, approval, preview
- Final half day: focused Playwright coverage, documentation, code review; deployment only if time remains

Do not spend more than roughly one hour on any optional feature while a mandatory feature remains incomplete.

## Phase 0 — Repository setup

- Create Next.js TypeScript app
- Add Tailwind CSS
- Add Supabase client packages
- Add OpenAI SDK or direct OpenRouter fetch implementation
- Add Zod
- Add Vitest for pure logic
- Add `.env.example`
- Delay Playwright until a browser-level workflow exists; when added, use the CLI runner only

Acceptance criteria:

- App starts locally
- `.env.local` is git-ignored
- No secret is present in committed files
- Type checking and linting commands are available

## Phase 1 — Authentication and protection

- Supabase browser and server clients
- Sign-up, sign-in, sign-out
- Middleware-based route protection covering the entire protected route group (not per-page checks)
- `/dashboard` and every `/projects/*` route visible only to authenticated users
- Add one focused Playwright test for signed-out redirect, checked against more than one protected route

Acceptance criteria:

- Signed-out visitor is redirected to `/login` from `/dashboard` and from a direct `/projects/[id]` URL
- Signed-in user can open `/dashboard`
- Focused auth test passes
- Manual incognito test passes

## Phase 2 — Schema and RLS

Run `supabase/migrations/001_initial_schema.sql`.

Acceptance criteria:

- All three tables exist (`projects`, `sections`, `rewrite_versions`)
- RLS is enabled on every table
- User A cannot select User B's rows
- User A cannot insert a row with User B's `user_id`

Verify with two test accounts and SQL or a focused integration check. Do not build a large browser suite for database behavior.

## Phase 3 — Project and section CRUD

- Project dashboard
- Create project
- Project settings for global instructions and target audience
- Create and edit sections (source text pasted/typed as Markdown, no PDF upload)
- Basic section ordering through numeric position field

Acceptance criteria:

- User can create a project and section
- Refresh preserves data
- Other users cannot see it

## Phase 4 — AI rewrite vertical slice

- Server-only `/api/rewrite` route or server action
- Load authenticated project and section
- Build prompt from system prompt, project instructions, section instructions, and source text
- Unit-test prompt construction and input validation
- Call OpenRouter with `anthropic/claude-sonnet-4.5`
- Save returned text as a rewrite version
- Display model name
- Add deterministic test mode for automated E2E tests

Acceptance criteria:

- A real OpenRouter call succeeds in a separate live check
- Mocked AI output supports deterministic automated tests
- Output is visible and persisted
- API key is absent from browser bundles and network payloads
- Empty output and provider errors show useful messages
- Production rejects enabled E2E test mode

## Phase 5 — Editing, versioning, approval

- Show rewrite versions newest first
- Allow manual editing of a version
- Approve a version
- Ensure only one approved version exists per section (enforced by the partial unique index in the schema)
- Unit-test approval-state logic where possible

Acceptance criteria:

- Regeneration creates a separate version
- Manual edits survive refresh
- Approving version B unapproves version A

## Phase 6 — Preview and export

- Project preview route
- Include approved sections in position order
- Add print stylesheet
- Add Print / Save as PDF button using `window.print()`

Acceptance criteria:

- Preview excludes unapproved versions
- Browser print output is readable
- App controls are hidden in print mode

## Phase 7 — Focused testing and evidence

Implement only the highest-value automated tests:

1. Signed-out redirect, checked against multiple protected routes
2. Rewrite happy path with mocked AI
3. Cross-user project isolation

Also complete:

- one manual real OpenRouter test;
- one approval-flow check;
- screenshot of visible AI output;
- AI code reviewer on at least one pull request.

Run focused specs during development. Run the full test suite once before merge and once before submission.

## Optional feature order (build only after Phase 7 is solid)

1. Model display (Easy)
2. Tuned system prompt and documented prompt iterations (Medium)
3. Cross-user privacy evidence (Bonus)

## Stretch, only if time remains

4. Playwright coverage for the AI happy path and signed-out lockout (Medium)
5. Deploy to Vercel (Medium) — configure environment variables, confirm `E2E_TEST_MODE` is absent or false, run incognito test against production, confirm no source maps or logs expose secrets or document content

## Stop conditions

Do not begin any optional or stretch feature when any of these remain broken:

- authentication
- RLS
- OpenRouter call
- persistence
- approval flow

If the same failure has been investigated three times without progress, stop, document the evidence, and choose the smallest next diagnostic step instead of continuing an autonomous debugging loop.
