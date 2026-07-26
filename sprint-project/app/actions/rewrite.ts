"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { rewriteInputSchema } from "@/lib/validation";
import { rewriteSection } from "@/lib/openrouter";

type ActionResult = {
  error?: string;
  success?: boolean;
  usage?: { totalTokens: number; cost: number | null };
};

export async function generateRewrite(
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = rewriteInputSchema.safeParse({
    section_id: formData.get("section_id"),
    section_instructions: formData.get("section_instructions") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { data: sectionData } = await supabase
    .from("sections")
    .select("id, project_id, source_text")
    .eq("id", parsed.data.section_id)
    .single();

  if (!sectionData) {
    return { error: "Section not found." };
  }

  const { data: projectData } = await supabase
    .from("projects")
    .select("target_audience, global_instructions")
    .eq("id", sectionData.project_id)
    .single();

  if (!projectData) {
    return { error: "Project not found." };
  }

  let result;
  try {
    result = await rewriteSection({
      projectInstructions: projectData.global_instructions,
      sectionInstructions: parsed.data.section_instructions,
      targetAudience: projectData.target_audience,
      sourceText: sectionData.source_text,
    });
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "The AI rewrite request failed.",
    };
  }

  const { error: insertError } = await supabase
    .from("rewrite_versions")
    .insert({
      section_id: sectionData.id,
      project_id: sectionData.project_id,
      user_id: user.id,
      rewritten_text: result.text,
      section_instructions: parsed.data.section_instructions,
      model: result.model,
      status: "draft",
    });

  if (insertError) {
    return { error: "Rewrite succeeded but could not be saved." };
  }

  revalidatePath(`/projects/${sectionData.project_id}/sections/${sectionData.id}`);
  return { success: true, usage: result.usage };
}
