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
