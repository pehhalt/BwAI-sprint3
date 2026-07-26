import { config } from "dotenv";
config({ path: ".env.local" });

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  // rewrite.spec.ts and cross-user.spec.ts both sign in with the same
  // shared E2E_TEST_EMAIL account; running spec files in parallel workers
  // races them against each other. Force single-worker execution locally.
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    // Always start a fresh instance so E2E_TEST_MODE is guaranteed to be
    // set. `true` would silently reuse any server already on this port
    // (e.g. a manually-run `npm run dev` for live UI review) without
    // E2E_TEST_MODE, making real, billed OpenRouter calls during automated
    // test runs instead of erroring. Note: Next.js also refuses a second
    // `next dev` in the same project directory regardless of port, so a
    // manual dev server on this port must be stopped before running e2e.
    reuseExistingServer: false,
    env: {
      E2E_TEST_MODE: "true",
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
