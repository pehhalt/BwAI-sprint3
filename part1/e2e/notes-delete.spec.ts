import { test, expect } from "@playwright/test";
import { uniqueTitle, editAndWaitForSave, createNoteAndWait } from "./helpers";

test("deleting a note removes it from the list after reload", async ({
  page,
}) => {
  await page.goto("/protected");

  const title = uniqueTitle("E2E Delete");

  await createNoteAndWait(page);
  const titleInput = page.getByPlaceholder("Untitled");
  await editAndWaitForSave(page, titleInput, title);

  // Reload before deleting so we select the note via its real, persisted
  // state rather than in-session state (see notes-create.spec.ts for why).
  await page.reload();
  await expect(
    page.locator("aside").getByText(title, { exact: true })
  ).toBeVisible();
  await page.locator("aside").getByText(title, { exact: true }).click();

  await page.getByTitle("Delete note").click();

  await page.reload();
  await expect(
    page.locator("aside").getByText(title, { exact: true })
  ).toHaveCount(0);
});
