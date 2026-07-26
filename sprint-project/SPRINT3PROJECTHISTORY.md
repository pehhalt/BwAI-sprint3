# Planning and execution history — Sprint 3 Final Project

This is the planning and build log for the Sprint 3 final project itself
("Ship an AI App of Your Own"), not a `partN` lesson write-up — kept for the
same reason as `mid-sprint-project/SPRINT3-MIDSPRINT-HISTORY.md`: so a fresh
session can see what was already decided and why, without re-reading the
whole conversation.

## Task received

Full verbatim official brief pasted by the user on 2026-07-25. Saved at
[`docs/superpowers/specs/2026-07-25-sprint-project-brief.md`](docs/superpowers/specs/2026-07-25-sprint-project-brief.md).

## Starting point

Before this session, the user had already worked out a detailed app concept
and near-complete spec with ChatGPT, dropped as eight files into a
`project-idea/` staging folder: `README.md`, `CLAUDE.md`, `AGENTS.md`,
`IMPLEMENTATION_PLAN.md`, `TEST_PLAN.md`, `system-prompt.md`,
`REFERENCES.md`, `env.example`, and `001_initial_schema.sql`. That folder
was explicitly staging only — never referenced from the real docs, and
deleted once its content had moved into place.

## App concept

**Script Rewriter** — an authenticated app for rewriting educational course
scripts with AI. A user creates a project, adds source sections (pasted
Markdown/plain text), sets project-wide and section-specific pedagogical
rewriting rules, generates a rewrite via OpenRouter, edits/regenerates,
approves exactly one version per section, and previews/prints the approved
sections as an assembled script. Grounded in a real use case: the user's own
German-language drum/music-theory course material for a mixed-level
audience (complete beginners through university-entrance-level theory).
Without the AI rewrite step the app is just a text editor — that's the
"why AI is core" answer for the reviewer call.

## Decisions made, in order

- [x] **How to use the pre-written ChatGPT docs?** Offered: treat as final
      and copy as-is / full brainstorm from scratch / treat as the design
      and sanity-check it against the actual course brief. Chose
      **sanity-check against the official brief** — the docs were unusually
      complete but had never been cross-checked against the real rubric.
- [x] **Cross-checked against the official brief** (see spec file). Found:
      no concrete model slug was ever pinned anywhere (brief requires one
      literally stated in `CLAUDE.md`); auth-lockout scope needed to
      explicitly cover every protected route, not just `/dashboard`;
      `docs/REFERENCES.md` needed the source URL as the literal first line
      of the file per the brief's wording. Confirmed as correct and
      unchanged: the memory/persistence requirement is satisfied by
      `rewrite_versions` (the "AI-generated outputs stored for review"
      option), RAG is correctly out of scope, and no service-role key is
      needed anywhere in this app.
- [x] **Model slug:** `anthropic/claude-sonnet-4.5` — chosen for long-form
      writing/instruction-following quality over raw speed, since the task
      is careful pedagogical rewriting, not chat. No prior part in this repo
      had already pinned a model to stay consistent with (Part 6's chatbot
      was deferred, never built).
- [x] **Cut `source_documents` / PDF storage entirely from MVP scope.** It
      was already marked optional in the original docs and isn't required
      by the official brief at all; dropping it removes a whole table, its
      RLS policy set, and the private Storage bucket + path-policy setup —
      a real time saving against the 2.5-day budget. Schema is now 3 tables:
      `projects`, `sections`, `rewrite_versions`. Sections keep
      `source_page_start`/`source_page_end` as plain manual metadata (no FK
      to a document).
- [x] **Deployment treated as a stretch goal, not baseline work.** The
      brief allows local-only verification (incognito window against the
      locally running app); Vercel deployment is itself only a Medium-tier
      optional task. Original `IMPLEMENTATION_PLAN.md` had baked it in as
      mandatory Phase 8 — moved to "only if time remains after everything
      else."
- [x] **Playwright MCP is avoided entirely**, per explicit user instruction
      (it was too slow and token-heavy on a prior part in this repo).
      Reserved strictly for a genuinely stuck CLI debugging session — not
      even used for final deployed-app verification, since deployment is
      now a stretch goal rather than an assumed step.
- [x] **Repo layout:** the app scaffolds directly at `sprint-project/` root
      — `app/`, `CLAUDE.md`, etc. at the top level — mirroring `part1`'s
      convention rather than nesting the app in a subfolder.

## Documentation written this session

All adapted from the `project-idea/` staging docs with the above changes
applied, and placed in their real locations (not referencing
`project-idea/` anywhere):

- `README.md`, `CLAUDE.md`, `AGENTS.md` (repo root)
- `docs/IMPLEMENTATION_PLAN.md`, `docs/TEST_PLAN.md`, `docs/REFERENCES.md`
- `prompts/system-prompt.md` (reused verbatim — already well-tuned for the
  real use case)
- `supabase/migrations/001_initial_schema.sql` (3-table version)
- `.env.example`

## Implementation plan written

Full 20-task step-by-step plan saved at
[`docs/superpowers/plans/2026-07-25-script-rewriter-mvp.md`](docs/superpowers/plans/2026-07-25-script-rewriter-mvp.md)
via the `writing-plans` skill. Covers Tasks 1–2 (scaffold + config), 3–7
(auth, middleware, schema/RLS), 8–9 (project/section CRUD), 10–12 (prompt,
OpenRouter adapter, rewrite generation + model display), 13–14 (approval
logic + versioning UI), 15 (preview/print), 16–17 (Playwright happy-path
and cross-user-isolation specs), 18 (manual verification/evidence pass),
19 (tuned-persona iteration pass), 20 (ai-code-reviewer + PR + merge).

One design correction made during the plan's self-review: `RewriteEditor`
was originally going to be written once (Task 12) with a manual-edit form
that calls `updateVersionText`, but that action doesn't exist until Task
14 — which would leave Task 12 unable to typecheck on its own, breaking
the "each task is independently reviewable" principle. Fixed by having
Task 12 ship a generate-only, read-only `RewriteEditor`, and Task 14
extend it (adds the edit form + a `projectId` prop) once
`app/actions/versions.ts` exists. Worth remembering if this pattern
(a component whose full feature set spans two tasks) comes up again.

## Not started yet

No code has been written. `project-idea/` has not yet been deleted — do
that only once the app has actually been scaffolded and these root docs
have been confirmed as the working set (Task 1 of the plan handles this:
back up the docs, scaffold, delete `project-idea/`, restore the docs).

Next step: choose an execution approach (subagent-driven-development or
executing-plans) and begin Task 1.

## Task 19: Tuned system-prompt persona iteration pass

Ran 3 real, non-trivial German excerpts against `prompts/system-prompt.md`
via a direct OpenRouter call (real `anthropic/claude-sonnet-4.5`, not
`E2E_TEST_MODE`) using the same prompt-construction logic as
`lib/openrouter.ts`/`lib/prompt.ts`: (A) the major scale
(Dur-Tonleiter, with a `[FIGURE: ...]` placeholder and an informal
"sounds brighter/happier" aside), (B) time signatures and syncopation
(Taktarten, with a `[FIGURE: ...]` placeholder), (C) triad construction
(Dreiklaenge, deliberately containing a "Dur klingt froehlich, Moll
klingt traurig" folk claim and an overgeneralized "root is always the
lowest note" imprecision).

Checked each tuned output against the system prompt's own "Required
behavior" list. Findings: the tuned persona correctly explained concepts
before naming them, preserved both `[FIGURE: ...]` placeholders
byte-for-byte, did not invent notation/citations, and — most notably for
excerpt C — explicitly separated the Dur/Moll interval definition from
its emotional connotation ("these associations depend on style, culture,
and usage") and corrected the root-note overgeneralization, neither of
which a generic-assistant baseline (same source text, plain "explain this
text more clearly" prompt, no system prompt, run separately) did — the
baseline stated "Major = happy/bright... a useful rule of thumb everyone
can remember" and "the root note is always the lowest note... that's just
how it works" as flat fact.

One real defect surfaced: the tuned rewrite for excerpt C came back
**entirely in English** despite the German source and an explicit
German-note-naming project instruction, while A and B in the same batch
stayed correctly in German. Root cause: the system prompt had a rule
about keeping German *note naming* but no rule requiring the *output
language* to match the *source language*, and the prompt's English
section-header scaffolding (`## Source section to rewrite`, etc.)
occasionally pulled the whole response into English.

**Change made**: added one line to `prompts/system-prompt.md`'s Required
behavior list:

> Write the rewritten section in the same language as the source text.
> The surrounding prompt labels and delimiters are in English for
> structure only; they are not an instruction to switch the language of
> your output.

Re-verified with 5 further live calls: 3 reruns of excerpt C (all
returned fully in German with correct definitions) and 1 rerun each of A
and B as a regression check (both remained correct, in German, with
figure placeholders intact and no editorial preface). Full transcripts
and the rule-by-rule comparison table are in
`.superpowers/sdd/task-19-report.md`.

## Task 20: final review, PR, and post-PR UI iteration

Ran the final whole-branch review (Opus) + Supabase/Next.js/Vercel
security scanners, all scoped to the full diff vs `main`. No Critical
findings anywhere. Fixed the 4 highest-priority Important findings before
opening the PR: dark-mode illegibility (unused scaffold CSS removed),
dead root route (`/` now redirects by auth state instead of showing
`create-next-app` boilerplate), two silently-swallowed failure paths
(approve/settings-save now surface errors), and ran `npm run build` for
the first time on this branch to confirm `OPENROUTER_API_KEY` never
appears in `.next/static`/`.next/server` — closing a previously
unperformed mandatory `docs/TEST_PLAN.md` check. Opened
[PR #4](https://github.com/pehhalt/BwAI-sprint3/pull/4) with both reports
recorded in the description. One Next.js-scanner "High" and one
Supabase-scanner "Medium" both re-flag the same intentional design choice
(RLS-only authorization, no app-level ownership backstop) already
documented in `CLAUDE.md` and endorsed across four earlier task reviews —
left as-is, not a defect.

After the PR was open, the user reviewed the running app directly and
asked for a round of UI/UX polish, executed iteratively (subagent per
larger change, direct edits for small CSS-only tweaks, per the user's
explicit "skip full testing/commit" instruction for those):

- **Delete project** (dashboard) and **delete section** (project page),
  both with a `window.confirm()` guard. Cascading deletion is handled
  entirely by the existing `on delete cascade` foreign keys — no manual
  application-level cascade logic.
- **Wider side-by-side editor layout** on the section page (source/AI
  rewrite panes close to A4 width) — surfaced and fixed a real CSS bug
  where `max-w-[1800px]` wasn't being respected due to a `flex` +
  `mx-auto` interaction suppressing `align-items: stretch`; fixed with an
  explicit `w-full`.
- **Dashboard and section lists converted from tiles to tables** with
  alternating row shading, and a fixed a classic HTML `table-layout: auto`
  bug where the delete-button column drifted toward the middle as row
  content varied — fixed by making the title column `w-full` and the
  action columns `whitespace-nowrap`.
- **Approval-status tag** added to the sections table (green
  "Approved" / gray "Not approved"), requiring a new per-project query for
  approved `rewrite_versions`.
- Consistent **darker border** (`border-gray-400`, up from the barely
  visible `border-gray-200`) applied to every panel/frame across the app;
  settings page widened and bordered to match.
- **Preview/print spacing**: added `mb-12` after the project title and
  after each section so consecutive sections in the printed output no
  longer run directly together.
- **Back-links added to every nested page** (section, settings, preview →
  back to project; project → back to dashboard), each paired with
  `SignOutButton` in the same header row, right-aligned.
- **Sign-in and sign-up split into separate pages** (`/login`, `/signup`),
  referencing `mid-sprint-project`'s existing pattern for avoiding layout
  jump between them: identical container width, padding, and card
  structure on both pages, just "a bit wider" (30rem vs. their 26rem) and
  using this project's `border-gray-400` convention instead of a CSS
  variable.
- Button color darkened (`bg-blue-600` → `bg-blue-800`) across all 5
  buttons that used it.

**Two real operational bugs found and fixed along the way**, both in
`playwright.config.ts`, not application code:

1. `workers: 1` pinned — `rewrite.spec.ts` and `cross-user.spec.ts` share
   the same `E2E_TEST_EMAIL` account and can race each other under
   default multi-worker execution (found while verifying the table
   conversion).
2. `reuseExistingServer: false` — the local default (`true`) silently
   reuses whatever is already listening on port 3000, including a
   manually-run `npm run dev` kept alive for live UI review, without
   `E2E_TEST_MODE` set. This was caught live: `rewrite.spec.ts` failed
   because it hit a real running dev server and got real (if odd) model
   output instead of the deterministic mock. A same-directory second
   `next dev` is also refused outright by Next.js 16 regardless of port,
   so a manual dev server must be stopped before running `npm run
   test:e2e`, not just pointed at a different port.

Documentation updated to match: `CLAUDE.md`'s route and component lists
(added `/signup`, `ProjectRow`/`DeleteSectionButton`/`ProjectSettingsForm`,
removed the stale `/api/rewrite` reference — model calls are server
actions only, there is no such route), `README.md`'s core user flow and
security-criteria wording (same `/api/rewrite` fix, delete mention added),
and `docs/TEST_PLAN.md` (moved the "Approval" scenario out of "Playwright
tests" into "Mandatory manual tests" since it was never actually
implemented as an automated spec — a pre-existing inaccuracy the original
whole-branch review had already flagged — and added a "Delete
project/section" manual-test entry). Screenshot recaptured to reflect the
current UI. A second whole-branch review + security-scanner pass was run
covering everything in this section (delete actions are genuinely
security/data-integrity relevant; `/signup` is a new auth surface) before
finalizing.

## Optional task: usage/cost indicator (Easy tier)

Added the "Easy: usage or cost indicator" optional task. `lib/openrouter.ts`
now sends `usage: { include: true }` in the OpenRouter request body and
parses the returned `usage.total_tokens`/`usage.cost` fields defensively
(the field is absent on some accounts/models, so `RewriteResult.usage` is
optional and parsing never throws if missing). `app/actions/rewrite.ts`
threads `result.usage` through the server action's return value, and
`RewriteEditor`'s generate form renders it (`"N tokens · ~$0.00NN"`) right
next to the "Generate rewrite" button when present. TDD: `lib/openrouter.test.ts`
updated first to assert the `E2E_TEST_MODE` mock's fixed `{ totalTokens: 42,
cost: 0.0007 }`, confirmed red, then implemented, confirmed green.

**Scope is deliberately ephemeral** — this is client-side `useActionState`
display only, not persisted to `rewrite_versions` (no migration, no new
column). On page reload the indicator simply isn't shown for past
generations; that's the intentional Easy-tier scope, not a bug.

`README.md`'s "Optional features targeted" list also updated: added this
item, and moved "Medium: Playwright coverage for the AI happy path and
signed-out lockout" out of the stretch-goal sentence into the main
targeted list, since `e2e/auth.spec.ts` and `e2e/rewrite.spec.ts` already
implement it and it was never actually claimed as done.
