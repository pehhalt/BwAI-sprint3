import { test, expect } from "@playwright/test";

const USER_A_EMAIL = process.env.E2E_TEST_EMAIL!;
const USER_A_PASSWORD = process.env.E2E_TEST_PASSWORD!;
const USER_B_EMAIL = process.env.E2E_TEST_EMAIL_B!;
const USER_B_PASSWORD = process.env.E2E_TEST_PASSWORD_B!;

test("user B cannot access user A's project", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(USER_A_EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(USER_A_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  const projectTitle = `Cross-user test ${Date.now()}`;
  await page.goto("/projects/new");
  await page.getByLabel("Title").fill(projectTitle);
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page).toHaveURL(/\/projects\/([0-9a-f-]+)$/);
  const projectUrl = page.url();

  await page.context().clearCookies();
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(USER_B_EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(USER_B_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto(projectUrl);
  await expect(page.getByText(/this page could not be found/i)).toBeVisible();

  await page.goto("/dashboard");
  await expect(page.getByText(projectTitle)).not.toBeVisible();
});
