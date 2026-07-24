# Sprint 3, Part 4 — Testing with Playwright + Playwright MCP

This folder holds the write-up for the "automated testing + live browser
control" lesson. Like `part3/`, there's no separate throwaway app here — the
work happens directly against the notes app at `part1/`, using the shared
`.claude/agents/` and `.claude/skills/` at the repo root.

## What this covers

- **Skills vs MCP** — why an MCP server keeps tool definitions resident in
  context for the whole session while a skill only loads on demand, and when
  each is the right call.
- **Playwright MCP** — installing the live-browser MCP server
  (`claude mcp add playwright npx @playwright/mcp@latest`), verifying it with
  `/mcp`, and a first exercise having the agent describe `anthropic.com` back
  to confirm it's really looking at the live page.
- **Playwright test suite** — scaffolding an end-to-end test suite for the
  notes app with `npm init playwright` (Chromium only), then adding a
  happy-path test per feature as it lands.
- **CLI vs MCP** — the general rule (one-off shell command vs. an ongoing
  connection the agent reaches for on its own), pinned into `part1/CLAUDE.md`.
- **Guided QA exercise** — using Playwright MCP against a public TodoMVC demo
  (`todolist.james.am`) to practice directing the agent to verify its own
  work, not just perform it.
- **TDD with Playwright MCP** — red/green/refactor where "red" is the agent
  actually running the test against the live app and watching it fail for
  the right reason, applied to a real next feature on the notes app.
- **Prototype vs production** — why maintenance (not initial build) is where
  most of the cost lives, and why the test suite + live verification habit
  is the guardrail for that.
- **Lab** — wiring all of the above into the notes app: 3 Playwright tests,
  Playwright MCP installed and used for one live verification, the suite
  committed to Git, plus an optional Part 5 swapping MCP for the
  **Playwright Agent CLI + skills** (`@playwright/cli`) to feel the token-cost
  difference first-hand.

See [`SPRINT3PART4HISTORY.md`](./SPRINT3PART4HISTORY.md) for the full
step-by-step checklist and the running log of what actually happened at each
step.

## State before this lesson started

- `part1/` has no test suite and no Playwright dependency yet — confirmed via
  `package.json` (no `@playwright/test`, no `test` script).
- No MCP servers are registered for this project yet (Supabase's MCP wasn't
  used in earlier parts; Playwright MCP will be the first).
- `part1/CLAUDE.md` doesn't yet have a CLI-vs-MCP rule — this lesson adds one.
