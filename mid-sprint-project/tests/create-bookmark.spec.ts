import { test, expect } from "@playwright/test";

function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@test-mid-sprint.dev`;
}

test("create a bookmark and confirm it survives a reload", async ({ page }) => {
  const email = uniqueEmail();
  await page.goto("/signup");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("Test1234!");
  await page.getByRole("button", { name: "Sign up" }).click();
  await expect(page).toHaveURL(/\/bookmarks/);

  await page.getByLabel("Title").fill("Anthropic");
  await page.getByLabel("URL").fill("https://www.anthropic.com");
  await page.getByRole("button", { name: "Save" }).click();

  await expect(page.getByRole("link", { name: "Anthropic" })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("link", { name: "Anthropic" })).toBeVisible();
});
