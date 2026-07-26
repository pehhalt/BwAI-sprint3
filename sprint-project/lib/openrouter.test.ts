import { afterEach, describe, expect, it, vi } from "vitest";
import { rewriteSection } from "./openrouter";

describe("rewriteSection", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns a deterministic mock result in E2E_TEST_MODE without calling OpenRouter", async () => {
    vi.stubEnv("E2E_TEST_MODE", "true");

    const result = await rewriteSection({
      projectInstructions: "",
      sectionInstructions: "",
      targetAudience: "",
      sourceText: "The C major scale.",
    });

    expect(result.text).toContain("E2E_TEST_MODE mock rewrite");
    expect(result.model).toBe(
      process.env.OPENROUTER_MODEL ?? "anthropic/claude-sonnet-4.5"
    );
    expect(result.usage).toEqual({ totalTokens: 42, cost: 0.0007 });
  });
});
