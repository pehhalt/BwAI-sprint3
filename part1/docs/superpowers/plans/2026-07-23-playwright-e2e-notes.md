# Playwright E2E Notes Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Install Playwright in `part1/` (the Next.js + Supabase notes app) and add three end-to-end tests covering note creation, edit persistence, and deletion, run against the real dev server and the real remote Supabase project.

**Architecture:** Playwright Test with a one-time UI-based auth "setup" project that logs in as a dedicated test user and saves `storageState`; all real tests reuse that session. Each spec creates its own uniquely-titled note (via the real UI, going through the app's existing autosave/server actions) so tests are independent and repeatable, and clean up after themselves where the test isn't itself about deletion.

**Tech Stack:** `@playwright/test`, `dotenv` (to load `.env.local` into the Node test-runner process), Chromium (Playwright's bundled browser, not system Chrome), Next.js dev server (`next dev`) auto-started by Playwright's `webServer`.

## Global Constraints

- All DB access in *application* code goes through `app/lib/db.ts` — not applicable here, since tests drive the app exclusively through the browser UI and never import `db.ts` or call Supabase directly. (CLAUDE.md rule 1)
- Auth must never be bypassed — the auth-setup step logs in through the real `/auth/login` form using `supabase.auth.signInWithPassword`, identical to a real user. (CLAUDE.md Authentication Rules)
- Secrets are configuration, not code — `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` go in `.env.local`, which is already gitignored (`sprint3/.gitignore` → `.env*.local`, and `part1/.gitignore` → `.env*`). Never hardcoded in test source.
- Test user: `ehhalt+test@gmail.com` / `SupaBaseTest1!` — a dedicated throwaway Supabase Auth account, already signed up.

---

## File Structure

| File | Responsibility |
|------|-----------------|
| `part1/playwright.config.ts` | Create. Playwright config: test dir, baseURL, webServer (auto-starts `next dev`), `setup` project (auth) + `chromium` project (depends on setup, reuses storageState). Loads `.env.local` via `dotenv`. |
| `part1/e2e/auth.setup.ts` | Create. Logs in once as the test user via the real login form, saves cookies to `e2e/.auth/user.json`. |
| `part1/e2e/helpers.ts` | Create. Two small shared helpers: `uniqueTitle(label)` for collision-free test data, `editAndWaitForSave(page, locator, value)` to fill a field and wait for the debounced autosave's network round-trip before asserting on persisted state. |
| `part1/e2e/notes-create.spec.ts` | Create. Test 1: create a note, confirm it appears in the sidebar list. |
| `part1/e2e/notes-edit-persists.spec.ts` | Create. Test 2: edit a note's body, reload, confirm the edit persisted. |
| `part1/e2e/notes-delete.spec.ts` | Create. Test 3: delete a note, reload, confirm it's gone. |
| `part1/.env.local` | Modify. Add `TEST_USER_EMAIL` and `TEST_USER_PASSWORD`. |
| `part1/.gitignore` | Modify. Add `/e2e/.auth/`, `/playwright-report/`, `/test-results/`. |
| `part1/package.json` | Modify. Add `@playwright/test` + `dotenv` devDependencies, add `"test:e2e": "playwright test"` script. |

**Why a `notes` array vs. live editor state matters:** the sidebar's `NoteCard` renders `note.title`/`note.body` from the committed `notes` array in `use-notes.ts`, which is only updated *after* the debounced autosave's `updateNoteAction` resolves (see `commitSave` in `components/notes/hooks/use-notes.ts:31-39`). The live `title`/`body` state used by the editor's input/textarea updates immediately on keystroke, but the sidebar lags behind by up to the 800ms debounce (`components/notes/hooks/use-notes.ts:66`) plus the network round-trip. Every test that types into a field and then checks the sidebar (or reloads) must wait for that save to actually land — that's what `editAndWaitForSave` is for.

---

## Task 1: Install Playwright and scaffold config

**Files:**
- Modify: `part1/package.json`
- Create: `part1/playwright.config.ts`
- Modify: `part1/.gitignore`

**Interfaces:**
- Produces: `playwright.config.ts` default export consumed implicitly by the `playwright test` CLI; defines `baseURL: "http://localhost:3000"` and project `storageState` path `"e2e/.auth/user.json"` that Task 2 must write to.

- [ ] **Step 1: Install dependencies**

Run:
```bash
npm install -D @playwright/test dotenv
npx playwright install chromium
```
Expected: `package.json` gains `@playwright/test` and `dotenv` under `devDependencies`; Chromium downloads without error.

- [ ] **Step 2: Add gitignore entries**

Edit `part1/.gitignore`, appending:
```
.env*

# Playwright
/e2e/.auth/
/playwright-report/
/test-results/
```
(Only add the three new Playwright lines — `.env*` already exists.)

- [ ] **Step 3: Write `playwright.config.ts`**

```ts
import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],
});
```

- [ ] **Step 4: Add the `test:e2e` script**

Edit `part1/package.json`, in `"scripts"` add:
```json
"test:e2e": "playwright test"
```

- [ ] **Step 5: Verify config loads**

Run: `npx playwright test --list`
Expected: exits non-zero with "No tests found" (or similar) — this confirms the config parses correctly before any spec files exist yet. A hard config/syntax error (stack trace mentioning `playwright.config.ts`) would mean Step 3 needs fixing.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json playwright.config.ts .gitignore
git commit -m "Add Playwright test runner and config"
```

---

## Task 2: Authenticated session setup

**Files:**
- Modify: `part1/.env.local`
- Create: `part1/e2e/auth.setup.ts`

**Interfaces:**
- Consumes: `process.env.TEST_USER_EMAIL`, `process.env.TEST_USER_PASSWORD` (loaded from `.env.local` by `playwright.config.ts` Task 1).
- Produces: `e2e/.auth/user.json` (storageState file), read by the `chromium` project in `playwright.config.ts` and therefore by every spec in Tasks 3–5.

- [ ] **Step 1: Add test user credentials to `.env.local`**

Append to `part1/.env.local`:
```
TEST_USER_EMAIL=ehhalt+test@gmail.com
TEST_USER_PASSWORD=SupaBaseTest1!
```

- [ ] **Step 2: Write the auth setup test**

```ts
// e2e/auth.setup.ts
import { test as setup, expect } from "@playwright/test";

const authFile = "e2e/.auth/user.json";

setup("authenticate", async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env.local"
    );
  }

  await page.goto("/auth/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Login" }).click();

  await page.waitForURL("/protected");
  await expect(page.getByTitle("New note")).toBeVisible();

  await page.context().storageState({ path: authFile });
});
```

- [ ] **Step 3: Run the setup project standalone**

Run: `npx playwright test --project=setup`
Expected: 1 passed. `e2e/.auth/user.json` now exists (`ls e2e/.auth`). If it fails on `waitForURL("/protected")`, the test account's email likely isn't confirmed yet in Supabase — confirm it (or disable email confirmation for this project) before continuing.

- [ ] **Step 4: Commit**

```bash
git add e2e/auth.setup.ts
git commit -m "Add Playwright auth setup for e2e tests"
```
(`.env.local` is gitignored and intentionally not committed.)

---

## Task 3: Shared test helpers

**Files:**
- Create: `part1/e2e/helpers.ts`

**Interfaces:**
- Produces: `uniqueTitle(label: string): string`, `editAndWaitForSave(page: Page, locator: Locator, value: string): Promise<void>` — consumed by Tasks 4, 5, 6.

- [ ] **Step 1: Write the helpers**

```ts
// e2e/helpers.ts
import type { Locator, Page } from "@playwright/test";

export function uniqueTitle(label: string): string {
  return `${label} ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Fills a field and waits for the app's debounced autosave (800ms, see
// components/notes/hooks/use-notes.ts) to actually round-trip to the
// server, so the caller can safely assert on state that only updates
// once the save lands (sidebar list, or state after a reload).
export async function editAndWaitForSave(
  page: Page,
  locator: Locator,
  value: string
): Promise<void> {
  const responsePromise = page.waitForResponse(
    (res) => res.request().method() === "POST" && res.ok(),
    { timeout: 10_000 }
  );
  await locator.fill(value);
  await responsePromise;
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no new type errors referencing `e2e/helpers.ts`.

- [ ] **Step 3: Commit**

```bash
git add e2e/helpers.ts
git commit -m "Add shared Playwright test helpers"
```

---

## Task 4: Test — create a note

**Files:**
- Create: `part1/e2e/notes-create.spec.ts`

**Interfaces:**
- Consumes: `uniqueTitle`, `editAndWaitForSave` from `./helpers`.

- [ ] **Step 1: Write the test**

```ts
// e2e/notes-create.spec.ts
import { test, expect } from "@playwright/test";
import { uniqueTitle, editAndWaitForSave } from "./helpers";

test("creating a note adds it to the notes list", async ({ page }) => {
  await page.goto("/protected");

  const title = uniqueTitle("E2E Create");

  await page.getByTitle("New note").click();
  const titleInput = page.getByPlaceholder("Untitled");
  await expect(titleInput).toBeVisible();
  await editAndWaitForSave(page, titleInput, title);

  await expect(
    page.locator("aside").getByText(title, { exact: true })
  ).toBeVisible();

  // Cleanup so repeated runs don't accumulate notes in the real account.
  await page.getByTitle("Delete note").click();
});
```

- [ ] **Step 2: Run it**

Run: `npx playwright test notes-create.spec.ts`
Expected: `1 passed`.

- [ ] **Step 3: Commit**

```bash
git add e2e/notes-create.spec.ts
git commit -m "Add e2e test: creating a note"
```

---

## Task 5: Test — edit persists after reload

**Files:**
- Create: `part1/e2e/notes-edit-persists.spec.ts`

**Interfaces:**
- Consumes: `uniqueTitle`, `editAndWaitForSave` from `./helpers`.

- [ ] **Step 1: Write the test**

```ts
// e2e/notes-edit-persists.spec.ts
import { test, expect } from "@playwright/test";
import { uniqueTitle, editAndWaitForSave } from "./helpers";

test("editing a note's body persists after reload", async ({ page }) => {
  await page.goto("/protected");

  const title = uniqueTitle("E2E Edit");
  const editedBody = `Edited body ${Date.now()}`;

  await page.getByTitle("New note").click();
  const titleInput = page.getByPlaceholder("Untitled");
  await editAndWaitForSave(page, titleInput, title);

  const bodyInput = page.getByPlaceholder("Start writing…");
  await editAndWaitForSave(page, bodyInput, editedBody);

  await page.reload();

  // Select explicitly rather than relying on sort order after reload.
  await page.locator("aside").getByText(title, { exact: true }).click();
  await expect(page.getByPlaceholder("Start writing…")).toHaveValue(
    editedBody
  );

  // Cleanup so repeated runs don't accumulate notes in the real account.
  await page.getByTitle("Delete note").click();
});
```

- [ ] **Step 2: Run it**

Run: `npx playwright test notes-edit-persists.spec.ts`
Expected: `1 passed`.

- [ ] **Step 3: Commit**

```bash
git add e2e/notes-edit-persists.spec.ts
git commit -m "Add e2e test: note edits persist after reload"
```

---

## Task 6: Test — delete a note

**Files:**
- Create: `part1/e2e/notes-delete.spec.ts`

**Interfaces:**
- Consumes: `uniqueTitle`, `editAndWaitForSave` from `./helpers`.

- [ ] **Step 1: Write the test**

```ts
// e2e/notes-delete.spec.ts
import { test, expect } from "@playwright/test";
import { uniqueTitle, editAndWaitForSave } from "./helpers";

test("deleting a note removes it from the list after reload", async ({
  page,
}) => {
  await page.goto("/protected");

  const title = uniqueTitle("E2E Delete");

  await page.getByTitle("New note").click();
  const titleInput = page.getByPlaceholder("Untitled");
  await editAndWaitForSave(page, titleInput, title);

  await expect(
    page.locator("aside").getByText(title, { exact: true })
  ).toBeVisible();

  await page.getByTitle("Delete note").click();

  await page.reload();

  await expect(
    page.locator("aside").getByText(title, { exact: true })
  ).toHaveCount(0);
});
```

- [ ] **Step 2: Run it**

Run: `npx playwright test notes-delete.spec.ts`
Expected: `1 passed`.

- [ ] **Step 3: Commit**

```bash
git add e2e/notes-delete.spec.ts
git commit -m "Add e2e test: deleting a note"
```

---

## Task 7: Run the full suite

**Files:** none (verification only)

- [ ] **Step 1: Run all three tests together**

Run: `npx playwright test`
Expected: `3 passed` (plus the `setup` project's 1 passed dependency run — 4 total).

- [ ] **Step 2: If anything fails, open the HTML report**

Run: `npx playwright show-report`
Diagnose using the trace (`trace: "retain-on-failure"` in config captures one automatically on failure).

---
