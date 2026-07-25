import { configDefaults, defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    // Vitest's default include pattern also matches *.spec.ts, which
    // collides with Playwright's e2e/*.spec.ts files (different test
    // runner, different test() implementation). Exclude e2e/ explicitly.
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      // Vitest doesn't set the "react-server" resolve condition Next.js's
      // bundler uses, so server-only's conditional export falls through to
      // the variant that throws unconditionally. Alias to the no-op variant
      // for tests only — the production Next.js build is unaffected and
      // still enforces the real server/client boundary.
      "server-only": path.resolve(__dirname, "node_modules/server-only/empty.js"),
    },
  },
});
