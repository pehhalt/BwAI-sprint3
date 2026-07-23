import { expect, type Locator, type Page } from "@playwright/test";

export function uniqueTitle(label: string): string {
  return `${label} ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Clicks "New note" and waits for the note to actually be created and
// selected before returning. The button's onClick handler
// (components/notes/notes-workspace.tsx newNote) is async and not
// awaited by React, so a bare .click() returns as soon as the new note
// has been created (a note is already open by default whenever the
// account has any notes at all), causing any immediately-following
// input into "the" title field to land on the wrong (previously
// selected) note. createNoteAction("Untitled", "") always sends this
// exact JSON-encoded argument list as its POST body, so matching on it
// precisely identifies the creation request rather than any other POST
// to the same page URL.
export async function createNoteAndWait(page: Page): Promise<void> {
  const responsePromise = page.waitForResponse(
    (res) =>
      res.request().method() === "POST" &&
      res.request().postData() === '["Untitled",""]'
  );
  await page.getByTitle("New note").click();
  await responsePromise;
}

// Fills a field and waits for the app's debounced autosave (800ms, see
// components/notes/hooks/use-notes.ts) to actually round-trip to the
// server, so the caller can safely assert on state that only updates
// once the save lands (sidebar list, or state after a reload).
//
// Deliberately watches the toolbar's "Saving…" -> "Saved" indicator
// rather than the network directly: Next.js issues more than one POST
// to the same page URL per action (e.g. note creation also POSTs to
// "/protected"), so a generic "any POST" matcher can catch an unrelated
// request and resolve before the real save has even started. The
// `saving` state, in contrast, is only ever toggled by this debounced
// save path (see components/notes/hooks/use-notes.ts scheduleSave), so
// it unambiguously reflects the operation this helper is waiting on.
export async function editAndWaitForSave(
  page: Page,
  locator: Locator,
  value: string
): Promise<void> {
  await locator.fill(value);
  await expect(page.getByText("Saving…")).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText("Saved")).toBeVisible({ timeout: 10_000 });
}
