import { test, expect } from "@playwright/test";

function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@test-mid-sprint.dev`;
}

test("sign up reaches bookmarks, log out blocks it, direct URL blocks it too", async ({ page }) => {
  const email = uniqueEmail();
  const password = "Test1234!";

  await page.goto("/signup");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign up" }).click();

  await expect(page).toHaveURL(/\/bookmarks/);
  await expect(page.getByRole("heading", { name: "Your bookmarks" })).toBeVisible();

  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login/);

  await page.goto("/bookmarks");
  await expect(page).toHaveURL(/\/login/);
});
