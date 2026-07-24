# What I did in Sprint 3, Part 4

## Exercise: Playwright test suite + Playwright MCP for the notes app

All work happens against the notes app at `part1/`. Nothing below is
checked off yet — this is the plan derived from the lesson content, to be
ticked off (with notes on what actually happened) as each step runs.

### Step 1 — Install Playwright MCP

- [x] Run in a terminal (not inside Claude Code), from `part1/`:
      `claude mcp add playwright npx @playwright/mcp@latest`
- [x] Open Claude Code, run `/mcp`, confirm `playwright · ✓ connected · NN tools`
      — confirmed: `playwright · ✓ connected · 24 tools`
- [ ] Drill into the `playwright` entry in `/mcp` to confirm command/args/config
      location (sanity check, not strictly required)

### Step 2 — Verify the MCP connection (Anthropic homepage exercise)

- [x] Paste into Claude Code:
      > Use Playwright MCP to open <https://www.anthropic.com>. Describe what
      > you see on the page: the headline, the main navigation, any
      > prominent call-to-action, and the overall mood. Take a screenshot at
      > the end so I can see what you saw.
      — required a one-time extra step first: Chrome wasn't installed, had
      to install it before Playwright MCP could launch a browser
- [x] Confirm a real Chromium window/screenshot and current page content
      (not a training-data guess). If the agent reaches for Bash/curl
      instead, re-prompt with "use Playwright MCP" explicitly.
      — confirmed: agent called the Playwright MCP tools (not Bash/curl),
      described current content that couldn't come from training data
      (referenced "Fable 5" and "Sonnet 5" releases and a "Claude Science"
      announcement), and saved a screenshot to `part1/anthropic-home.png`

### Step 3 — Scaffold the Playwright test suite (Lab Part 1)

Process note: rather than making the change directly on `main`, the agent in
the `part1/` session wrote a superpowers plan first and created a feature
branch for this work — following the project's existing
`writing-plans` / `test-driven-development` skill habits rather than the
lesson's literal one-shot prompt. Tracking that branch's progress below.

- [x] Paste into Claude Code (run from `part1/`):
      > Install Playwright for end-to-end testing in this project. Then
      > write three tests:
      > 1. Create a new note and confirm it appears in the notes list.
      > 2. Open a note, edit the body text, refresh the page, and confirm
      >    the edited text is still there.
      > 3. Delete a note and confirm it no longer appears in the list after
      >    refreshing.
      >
      > Run all three tests and show me the results. All three must pass
      > before we move on.
- [x] Confirm `npm init playwright` ran with Chromium-only config and a
      `webServer` entry in `playwright.config.ts` so the dev server starts
      automatically
- [x] All 3 tests passing before moving to Step 4 — if not, direct the agent
      to fix the underlying behaviour, not the test
      — all 3 pass reliably (verified across multiple consecutive runs);
      auth is a real login, not mocked

**Outcome:** worked via superpowers plan → feature branch → PR, not a single
one-shot prompt. Branch pushed and opened as
[PR #3](https://github.com/pehhalt/BwAI-sprint3/pull/3), covering:
`create`, `edit-persists-after-reload`, `delete-persists-after-reload`.
Commits: `0ba0604`, `0d8ad7a`, `579f949` (edit-persists test +
`createNoteAndWait` fix, plus updating the create test to match),
`b0cf03a` (delete test), `d6df6fa` (plan doc added to branch).

Two real bugs were found and fixed along the way (this is the payoff the
lesson keeps pointing at — tests catching things a manual click-through
missed):

- A locale-dependent hydration mismatch in `formatDate()`.
- A race in the "New note" flow's test helper that could end up editing the
  wrong note.

Before merging, a stray "2 uncommitted changes" warning was checked and
confirmed unrelated to this branch: the `anthropic-home.png` screenshot from
Step 2 and the untracked `part4/` docs folder (this README + history file) —
neither belongs to the Playwright branch.

PR #3 merged into `main` — merge commit `8e05b9f`.

### Step 4 — Live browser verification with Playwright MCP (Lab Part 3)

- [x] Start the dev server (`npm run dev` in `part1/`) in its own terminal
- [x] Paste into Claude Code:
      > Use Playwright MCP to open the running app at localhost:3000. Pick
      > one behaviour from the notes app that you haven't tested yet and
      > verify it works end-to-end. Take a screenshot before and after the
      > action. Report what you found — did it work as expected, or did you
      > spot anything off?
- [x] Record which behaviour was picked and the result (pass, or a real bug
      found + fixed + re-verified)

**Outcome:** picked adding a tag to a note (create note → title → type new
tag name → Enter to confirm the "Create '`tag-name`'" suggestion) — not
covered by the automated suite, which only tests create/edit-body/delete.

Passed end-to-end: the tag appeared in all three places at once (editor tag
list, sidebar note card, sidebar "Filter by tag" pills), and survived a full
page reload — confirming it round-tripped through Supabase rather than only
updating local/optimistic UI state. Screenshots: `tag-test-before.png`,
`tag-test-after.png`.

One gotcha noted, not a bug: right after "New note," the sidebar briefly
shows two visually-identical "Untitled" cards since creation is async and
the click handler doesn't block on it — the same underlying race already
caught and fixed in the `createNoteAndWait` test helper (Step 3). Handled
here by typing a distinguishing title before continuing.

Housekeeping: found and deleted a stray leftover test note
(`E2E Create 1784768114354-iu59kv`) left over from an earlier manual test
run; account back down to just the original pre-existing "Untitled" note.

### Step 5 — Pin the CLI-vs-MCP rule in CLAUDE.md

- [x] Add to `part1/CLAUDE.md`:
      > Use the CLI for one-off tasks. Use MCP when the agent needs to
      > repeat or react to what's on screen.
      — added as a new "Testing" section (right after Non-Negotiable Rules),
      with the CLI/MCP split spelled out concretely: `npx playwright test`
      for the e2e suite, Playwright MCP for exploring untested behaviour or
      confirming a freshly built feature. Committed directly to `main`
      (`4210a3e`, not via a feature branch/PR — a small doc-only change) and
      pushed to `origin/main`.

### Step 6 — Commit the test suite (Lab Part 4)

- [x] Paste into Claude Code:
      > Commit the playwright.config file and the tests/ folder to Git. Use
      > the commit message: "Add Playwright test suite for core note
      > behaviours"
      — already satisfied by Step 3: `playwright.config.ts` and `tests/`
      were committed and merged via PR #3 (`0ba0604`, `0d8ad7a`, `579f949`,
      `b0cf03a`), since the agent used its own plan → branch → PR workflow
      instead of one direct commit. No separate commit needed here.
- [x] Reflection (1-2 sentences, recorded below once done): which kinds of
      bugs did the tests catch that were missed in earlier sessions?
      — the tests caught a locale-dependent hydration mismatch in
      `formatDate()` and a race condition in the "New note" flow (a helper
      could edit the wrong note right after creation) — both silent bugs
      that a quick manual click-through wouldn't reliably surface, but that
      an automated re-run catches every time.

### Step 7 (optional) — Guided QA exercise on a public TodoMVC demo

Practice exercise only — not against the notes app, no repo changes expected.

- [x] Paste into Claude Code:
      > Use Playwright MCP to go to <https://todolist.james.am/#/>. Add a new
      > todo called "clean my room". After adding it, double-check whether
      > the todo was actually registered, and flag anything else you notice
      > that looks off.
- [x] Confirm the agent verifies "clean my room" actually appears (e.g. via
      the `#/active` filter)
      — confirmed two ways: checked `localStorage` (`todos-angularjs` key)
      directly, and did a full page reload, verifying it persisted, stayed
      unchecked, showed under "active", and correctly did not show under
      "Completed"
- [x] Confirm the agent flags the known "0 items left" counter bug on its
      own; if not, follow up with: "Did the items-left counter update?
      Click around and double-check."
      — flagged unprompted, and correctly diagnosed it as surviving a full
      reload (not a display-timing glitch)

**Outcome:** went beyond the two things this step asks for and surfaced
three more real issues on its own initiative:

- "Mark all as complete" toggle shows checked despite the one todo being
  incomplete — same likely root cause as the counter bug (summary/toggle
  binding reading the wrong state, while per-item completion state and
  filtering are unaffected).
- Three console 404s on page load: `favicon.ico`, `learn.json`, and `/api` —
  the `/api` one flagged as likely dead code, since the app is entirely
  `localStorage`-backed and doesn't appear to use it for anything.
- Two copy typos: "What need's to be done?" (stray apostrophe) and "Double-
  click to edit a toodo" (should be "todo").

Screenshot saved to `todolist-clean-my-room.png`. Good demonstration of the
lesson's core point — directing the agent to verify its own work surfaces
more than "did the thing I asked for work."

### Step 8 (optional) — TDD loop with Playwright MCP on a real feature

Pick one real next feature for the notes app (e.g. the "Show only my notes"
filter used as the lesson's example, or another small feature) and run the
red → green loop:

- [ ] Ask the agent to write the Playwright test first, run it via Playwright
      MCP, and confirm it fails for the right reason (feature doesn't exist
      yet) — not because the test itself is broken
- [ ] Build the feature
- [ ] Re-run the test via Playwright MCP, confirm it passes — explicitly ask
      the agent to show the re-run output rather than just declaring success
- [ ] Watch for the two known failure modes: agent claims "passing" without
      re-running, or agent edits the test/assertions instead of fixing the
      feature

### Step 9 (optional) — Playwright Agent CLI + skills (Lab Part 5)

Swap Playwright MCP for the one-shot Agent CLI to feel the token-cost
difference directly.

- [ ] Remove the MCP server (terminal, not inside Claude Code):
      `claude mcp remove playwright` (add `--scope user` too if that's how it
      was originally added)
- [ ] Confirm removal via `claude mcp list` or `/mcp` inside Claude Code
- [ ] Install the Agent CLI + skills:
      `npm install -g @playwright/cli@latest`
      `playwright-cli install-browser`
      `playwright-cli install --skills`
- [ ] Confirm `.claude/skills/playwright-cli/` landed (project-scoped —
      commit it if keeping this path)
- [ ] Repeat the Step 4 live-verification behaviour, this time forcing the
      Agent CLI:
      > Use the Playwright Agent CLI to open the running app at
      > localhost:3000. Pick one behaviour from the notes app and verify it
      > works end-to-end. Take a screenshot at the end. Use the Playwright
      > Agent CLI for this, not MCP.
- [ ] Note the felt difference (one-shot per action vs. agent reaching for
      the browser on its own) and, if desired, re-add Playwright MCP
      afterward: `claude mcp add playwright npx @playwright/mcp@latest`

## Notes / decisions log

To be filled in as steps are completed.
