# AGENTS.md

## Mission

Deliver the smallest secure vertical slice of the Script Rewriter app within the sprint deadline. Optimize for working software, clear evidence, and low-risk changes rather than broad feature coverage.

## Read first

Before changing code, read only the files relevant to the task. At minimum, consult:

- `CLAUDE.md` for architecture, security, and product constraints;
- `docs/IMPLEMENTATION_PLAN.md` for build order;
- `docs/TEST_PLAN.md` when the task changes observable behavior or security.

Do not repeatedly inspect the whole repository without a concrete reason.

## Working method

For each task:

1. State the smallest planned change.
2. List the files likely to change.
3. Identify security or data-isolation implications.
4. Define concise acceptance criteria.
5. Add or update one focused test when the behavior warrants it.
6. Implement the smallest change that satisfies the criteria.
7. Run only the relevant test first.
8. Run type checking and linting.
9. Stop and summarize changed files, commands run, and remaining risks.

Work in small feature branches. Keep one coherent change per pull request. Do not broaden scope without explicit approval.

## Priority order

1. Authentication and protected routes
2. Database schema and RLS
3. Project and section CRUD
4. Server-side OpenRouter rewrite
5. Save and display rewrite versions
6. Approve one version per section
7. Preview and print stylesheet
8. Focused tests, documentation
9. Optional features only after the mandatory vertical slice works: model display, then tuned system-prompt persona, then cross-user privacy evidence
10. Stretch, only if time remains: Playwright coverage for the AI feature, then Vercel deployment

## Testing strategy

Use targeted TDD, not exhaustive browser-driven TDD.

### Unit tests

Use Vitest for pure logic, including:

- prompt construction;
- input validation;
- AI response parsing;
- approval-state logic;
- preservation of figure placeholders.

Do not use Playwright for logic that can be tested without a browser.

### Playwright tests

Keep the initial suite to critical user journeys:

1. A signed-out visitor is redirected to sign-in — tested against multiple protected routes, not only `/dashboard`.
2. A signed-in user can create a section and save an AI rewrite.
3. User B cannot access User A's project.

Add another end-to-end test only when it covers a required evaluation criterion or a critical regression.

### Playwright execution rules

- Use Playwright CLI. Do not use Playwright MCP for routine development, verification, or regression checks — it is too slow and token-heavy for this sprint's budget.
- Playwright MCP may only be used as a last resort, when a CLI failure is genuinely unclear after investigation and visual inspection is the only way to make progress. This applies even to a deployed app — deployment itself is a stretch goal here, not a reason to reach for MCP.
- Run one spec or one named test during development.
- Run the full suite only before merging or submission.
- Retain traces, screenshots, and videos only on failure.
- Do not enter open-ended autonomous browser-debugging loops.

Preferred focused commands:

```bash
npm test -- path/to/test-file.test.ts
npx playwright test tests/auth.spec.ts
npx playwright test -g "redirects signed-out visitors"
```

Milestone checks:

```bash
npm run typecheck
npm run lint
npm run test
npm run test:e2e
```

## LLM test policy

Normal automated tests must not call OpenRouter.

- Use deterministic mocked AI output in Playwright tests.
- Keep test mode server-side only.
- Never expose a test switch through a `NEXT_PUBLIC_` variable.
- Production must fail safely if test mode is enabled.
- Maintain one separate manual or non-default integration check that calls OpenRouter for real.

Suggested guard:

```ts
if (
  process.env.NODE_ENV === "production" &&
  process.env.E2E_TEST_MODE === "true"
) {
  throw new Error("E2E_TEST_MODE must not be enabled in production.");
}
```

## Failure stop rule

If the same test fails three times without clear progress, stop and report:

- the exact failure;
- attempted fixes;
- the most likely cause;
- the smallest proposed next step.

Do not continue consuming time and tokens without a new hypothesis.

## Constraints

- Do not implement RAG.
- Do not implement PDF upload, parsing, or storage.
- Do not build a chatbot.
- Do not use the Supabase service-role key anywhere — this app does not need one.
- Do not call OpenRouter from a client component.
- Do not weaken RLS to fix a frontend problem.
- Do not refactor unrelated code during a feature task.
- Do not add dependencies without a concrete need.
- Do not use Playwright MCP outside the last-resort case described above.

## Expected completion report

After each task, report:

- what changed;
- files changed;
- tests and checks run;
- what was not tested;
- unresolved risks;
- the next smallest task.

## Pull request checklist

- [ ] Scope matches one planned feature
- [ ] No secrets committed
- [ ] Server/client boundary is correct
- [ ] RLS remains enabled
- [ ] Error and loading states exist
- [ ] Focused tests pass
- [ ] Type checking passes
- [ ] Lint passes
- [ ] Manual test steps are included
- [ ] AI code reviewer report is recorded before merge
