import { describe, expect, it } from "vitest";
import {
  projectInputSchema,
  sectionInputSchema,
  rewriteInputSchema,
} from "./validation";

describe("projectInputSchema", () => {
  it("accepts a minimal valid project", () => {
    const result = projectInputSchema.safeParse({ title: "My course" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty title", () => {
    const result = projectInputSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });
});

describe("sectionInputSchema", () => {
  it("accepts a section with a page range", () => {
    const result = sectionInputSchema.safeParse({
      project_id: "550e8400-e29b-41d4-a716-446655440000",
      title: "Chapter 1",
      source_text: "Some source text.",
      source_page_start: 1,
      source_page_end: 3,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid project_id", () => {
    const result = sectionInputSchema.safeParse({
      project_id: "not-a-uuid",
      title: "Chapter 1",
      source_text: "Some source text.",
    });
    expect(result.success).toBe(false);
  });
});

describe("rewriteInputSchema", () => {
  it("defaults section_instructions to an empty string", () => {
    const result = rewriteInputSchema.safeParse({
      section_id: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.section_instructions).toBe("");
    }
  });
});
