import { expect, type Locator, type Page } from "@playwright/test";

export function uniqueTitle(label: string): string {
  return `${label} ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
