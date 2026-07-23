import { test, expect } from "@playwright/test";
import { uniqueTitle, editAndWaitForSave, createNoteAndWait } from "./helpers";

test("editing a note's body persists after reload", async ({ page }) => {
  await page.goto("/protected");

  const title = uniqueTitle("E2E Edit");
  const editedBody = `Edited body ${Date.now()}`;

  await createNoteAndWait(page);
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
