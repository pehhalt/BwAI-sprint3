import { test, expect } from "@playwright/test";

const EMAIL = process.env.E2E_TEST_EMAIL!;
const PASSWORD = process.env.E2E_TEST_PASSWORD!;

test("signed-in user can create a section and save an AI rewrite", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto("/projects/new");
  await page.getByLabel("Title").fill(`E2E project ${Date.now()}`);
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page).toHaveURL(/\/projects\/[0-9a-f-]+$/);

  await page.getByLabel("Section title").fill("Intro");
  await page
    .getByLabel("Source text")
    .fill("This is the original source text for the intro section.");
  await page.getByRole("button", { name: "Add section" }).click();

  await page.getByRole("link", { name: "Intro" }).click();
  await expect(page).toHaveURL(/\/sections\/[0-9a-f-]+$/);

  await page.getByRole("button", { name: "Generate rewrite" }).click();
  await expect(page.getByText(/E2E_TEST_MODE mock rewrite/)).toBeVisible();

  await page.reload();
  await expect(page.getByText(/E2E_TEST_MODE mock rewrite/)).toBeVisible();
});
