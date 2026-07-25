import { test, expect } from "@playwright/test";

test("redirects a signed-out visitor away from protected routes", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);

  await page.goto("/projects/00000000-0000-0000-0000-000000000000");
  await expect(page).toHaveURL(/\/login/);
});
