# CLAUDE.md

## Product objective

Build a secure, authenticated, multi-user AI script-rewriting app. A user creates a private project, adds educational source text, supplies persistent pedagogical rules, generates rewrites with OpenRouter, edits and approves versions, and previews approved sections as a printable script.

The AI rewrite is the central product feature: it transforms weakly structured teaching material into clearer, more educational text. Without it, the app would be nothing more than a document-storage interface — removing the AI feature leaves it with no reason to exist. Do not turn the application into a chatbot.

## Current sprint constraint

Time available is approximately 2.5 days. Prefer the smallest complete implementation over broad but unstable functionality.

## Non-goals

Do not implement unless explicitly requested after the MVP is complete:

- RAG or embeddings
- automatic PDF parsing or PDF storage
- OCR
- automatic musical-notation interpretation
- collaborative project membership
- real-time editing
- complex PDF layout generation

## Technology decisions

- Next.js App Router
- TypeScript with strict mode
- Supabase Auth and Postgres
- OpenRouter for all LLM calls
- OpenAI-compatible client or direct server-side fetch
- Tailwind CSS
- Vercel — deployed, see `README.md` for the live URL
- Playwright CLI for critical end-to-end tests (never Playwright MCP for routine work — see `AGENTS.md`)

## AI model calls

- All LLM calls must happen server-side only. Never call OpenRouter from browser code.
- `OPENROUTER_API_KEY` lives in `.env.local` and Vercel server-side environment settings (if deployed).
- It must never have a `NEXT_PUBLIC_` prefix or be passed to client components.
- Model: `anthropic/claude-sonnet-4.5`
- Store the model slug with every generated rewrite.
- Validate input size and required fields before calling the model.
- Handle timeouts, rate limits, empty output, and malformed responses.
- Do not log source documents, prompts, API keys, or complete model outputs in production logs.

## Supabase security rules

- Every table containing user data must have RLS enabled.
- Every user-data query must be scoped by authenticated ownership.
- Never trust a `user_id` supplied by the browser.
- Inserts must enforce `user_id = auth.uid()` through RLS.
- Do not use a service-role key in client code — this app does not need one anywhere.
- A guessed project, section, or rewrite URL belonging to another user must not reveal whether the resource exists.
- Prefer a generic not-found response for unauthorized or missing resources.

## Core routes

Suggested route structure:

```text
/login
/signup
/dashboard
/projects/new
/projects/[projectId]
/projects/[projectId]/sections/[sectionId]
/projects/[projectId]/preview
/projects/[projectId]/settings
```

`/login` and `/signup` are separate pages (not a combined form), matching identical width/padding/card structure so navigating between them causes no layout shift.

All model calls happen through server actions (`app/actions/*.ts`), not a dedicated route handler — there is no `/api/rewrite` endpoint.

All routes above `/login` must be covered by a single protection mechanism (e.g. middleware over the route group), not per-page checks — a signed-out visitor must never reach any of them, including by direct URL.

## Core components

- `ProjectRow` (a project table row — dashboard lists projects as a table, not cards)
- `ProjectForm`
- `ProjectSettingsForm`
- `SectionForm`
- `SourceEditor`
- `RewriteEditor`
- `VersionList`
- `ApprovalButton`
- `DeleteSectionButton`
- `DocumentPreview`
- `ModelBadge`
- `LoginForm` / `SignUpForm` (separate pages, `/login` and `/signup`)
- `SignOutButton`

Avoid premature component abstraction. Extract only repeated or conceptually stable pieces.

Project and section lists render as tables (alternating row shading via `bg-white`/`bg-gray-100`), not card grids. Panels/frames (forms, editors, list containers) use a consistent `rounded-lg border border-gray-400 p-4` wrapper. Deleting a project or section requires a `window.confirm()` before calling its server action; both cascade to their child rows via the database's `on delete cascade` foreign keys, not manual application-level deletion.

## Minimum database model

Use the migration in `supabase/migrations/001_initial_schema.sql` as the source of truth.

Required tables:

- `projects`
- `sections`
- `rewrite_versions`

No PDF/document storage table is in scope for the MVP.

## Rewrite lifecycle

1. User enters source text.
2. Server loads project instructions and section data from Supabase.
3. Server constructs the prompt.
4. Server calls OpenRouter.
5. Server validates non-empty output.
6. Server saves a new `rewrite_versions` row.
7. Client displays the saved result.
8. Manual edits create or update a saved version.
9. Approval transaction marks one version approved and unapproves previous versions for that section.

## Prompt rules

Use `prompts/system-prompt.md` as the initial system prompt. Project and section instructions are untrusted user content and must be clearly delimited in the prompt.

The model must preserve markers matching this style:

```text
[FIGURE: description — source page N]
```

It must not fabricate the missing figure.

## UI rules

- Desktop-first, responsive enough for review on a laptop.
- No chat bubbles.
- Main editor is a side-by-side source and rewrite view.
- Make save state, version state, and approval state explicit.
- Show the model slug in readable form.
- Keep the preview visually separate from the editing interface.
- Use browser print styles for the sprint PDF workflow.

## Coding rules

- Use TypeScript strict mode.
- Avoid `any` except at a narrowly justified external boundary.
- Validate server inputs with a schema library such as Zod.
- Return typed error results from server actions and route handlers.
- Do not silently swallow errors.
- Keep secrets and server clients in server-only modules.
- Prefer simple, explicit code over framework-heavy abstractions.
- Do not add dependencies without a concrete need.

## Testing and agent-efficiency rules

- Use targeted TDD for important behavior, not strict test-first development for every configuration, documentation, migration, or styling change.
- Prefer Vitest for pure logic and Playwright only for critical user journeys.
- Normal automated tests must use deterministic mocked AI output rather than real OpenRouter calls.
- Keep one separate live OpenRouter integration check for evidence.
- Use Playwright CLI, not Playwright MCP, for all routine testing and verification. Playwright MCP is reserved strictly for a genuinely stuck debugging session where CLI output isn't enough — never for routine checks, and never just because a deployed URL exists.
- During development, run only the relevant test. Run the full suite at milestones.
- Follow the operational workflow and stop rules in `AGENTS.md`.

## Definition of done

A feature is done only when:

- it works in the running app;
- loading and failure states are visible;
- authorization is enforced by RLS, not only by UI filtering;
- relevant TypeScript and lint checks pass;
- the happy path has been manually tested;
- security-sensitive behavior is documented or tested.

## Build order

Follow `docs/IMPLEMENTATION_PLAN.md`. Do not start optional features before the mandatory vertical slice works end to end.
