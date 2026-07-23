import { test, expect } from "@playwright/test";
import { uniqueTitle, editAndWaitForSave } from "./helpers";

test("creating a note adds it to the notes list", async ({ page }) => {
  await page.goto("/protected");

  const title = uniqueTitle("E2E Create");

  await page.getByTitle("New note").click();
  const titleInput = page.getByPlaceholder("Untitled");
  await expect(titleInput).toBeVisible();
  await editAndWaitForSave(page, titleInput, title);

  // Reload so the assertion reflects real persisted state rather than
  // in-session state, which can be transiently stale (see
  // components/notes/utils.ts formatDate — a server/client locale
  // mismatch triggers a hydration-recovery remount that can race with
  // the just-completed autosave).
  await page.reload();
  await expect(
    page.locator("aside").getByText(title, { exact: true })
  ).toBeVisible();

  // Cleanup so repeated runs don't accumulate notes in the real account.
  await page.locator("aside").getByText(title, { exact: true }).click();
  await page.getByTitle("Delete note").click();
});
