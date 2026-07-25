"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sectionInputSchema } from "@/lib/validation";

type ActionResult = { error?: string; success?: boolean };

export async function createSection(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = sectionInputSchema.safeParse({
    project_id: formData.get("project_id"),
    title: formData.get("title"),
    source_text: formData.get("source_text"),
    source_page_start: formData.get("source_page_start") || undefined,
    source_page_end: formData.get("source_page_end") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { count } = await supabase
    .from("sections")
    .select("id", { count: "exact", head: true })
    .eq("project_id", parsed.data.project_id);

  const { error } = await supabase.from("sections").insert({
    ...parsed.data,
    user_id: user.id,
    position: count ?? 0,
  });

  if (error) {
    return { error: "Could not create section." };
  }

  revalidatePath(`/projects/${parsed.data.project_id}`);
  return { success: true };
}

export async function updateSectionText(
  projectId: string,
  sectionId: string,
  sourceText: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const trimmed = sourceText.trim();
  if (!trimmed) {
    return { error: "Source text cannot be empty." };
  }

  const { error } = await supabase
    .from("sections")
    .update({ source_text: trimmed })
    .eq("id", sectionId);

  if (error) {
    return { error: "Could not save source text." };
  }

  revalidatePath(`/projects/${projectId}/sections/${sectionId}`);
  return { success: true };
}
