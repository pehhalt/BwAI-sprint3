import { describe, expect, it } from "vitest";
import { buildRewritePrompt } from "./prompt";

describe("buildRewritePrompt", () => {
  it("includes all provided sections in delimited blocks", () => {
    const prompt = buildRewritePrompt({
      projectInstructions: "Keep it concise.",
      sectionInstructions: "Focus on rhythm notation.",
      targetAudience: "Beginner drummers.",
      sourceText: "The C major scale consists of...",
    });

    expect(prompt).toContain("<project_instructions>");
    expect(prompt).toContain("Keep it concise.");
    expect(prompt).toContain("<section_instructions>");
    expect(prompt).toContain("Focus on rhythm notation.");
    expect(prompt).toContain("<target_audience>");
    expect(prompt).toContain("Beginner drummers.");
    expect(prompt).toContain("<source_text>");
    expect(prompt).toContain("The C major scale consists of...");
  });

  it("falls back to a placeholder when instructions are empty", () => {
    const prompt = buildRewritePrompt({
      projectInstructions: "",
      sectionInstructions: "",
      targetAudience: "",
      sourceText: "Source.",
    });

    expect(prompt).toContain("(none provided)");
  });
});
