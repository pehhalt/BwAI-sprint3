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
