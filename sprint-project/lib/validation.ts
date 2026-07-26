import { z } from "zod";

export const projectInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  target_audience: z.string().trim().max(2000).default(""),
  global_instructions: z.string().trim().max(4000).default(""),
});
export type ProjectInput = z.infer<typeof projectInputSchema>;

export const sectionInputSchema = z.object({
  project_id: z.string().uuid(),
  title: z.string().trim().min(1).max(300),
  source_text: z.string().trim().min(1).max(20000),
  source_page_start: z.coerce.number().int().positive().optional(),
  source_page_end: z.coerce.number().int().positive().optional(),
});
export type SectionInput = z.infer<typeof sectionInputSchema>;

export const rewriteInputSchema = z.object({
  section_id: z.string().uuid(),
  section_instructions: z.string().trim().max(4000).default(""),
});
export type RewriteInput = z.infer<typeof rewriteInputSchema>;

export const uuidSchema = z.string().uuid();
