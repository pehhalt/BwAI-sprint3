"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { projectInputSchema, uuidSchema } from "@/lib/validation";

type ActionResult = { error?: string; success?: boolean };

export async function createProject(formData: FormData): Promise<ActionResult | void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = projectInputSchema.safeParse({
    title: formData.get("title"),
    target_audience: formData.get("target_audience") ?? "",
    global_instructions: formData.get("global_instructions") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({ ...parsed.data, user_id: user.id })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Could not create project." };
  }

  revalidatePath("/dashboard");
  redirect(`/projects/${data.id}`);
}

export async function updateProjectSettings(
  projectId: string,
  formData: FormData
): Promise<ActionResult | void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = projectInputSchema.safeParse({
    title: formData.get("title"),
    target_audience: formData.get("target_audience") ?? "",
    global_instructions: formData.get("global_instructions") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { error } = await supabase
    .from("projects")
    .update(parsed.data)
    .eq("id", projectId);

  if (error) {
    return { error: "Could not update project." };
  }

  revalidatePath(`/projects/${projectId}/settings`);
  revalidatePath(`/projects/${projectId}`);
}

export async function deleteProject(projectId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsedId = uuidSchema.safeParse(projectId);
  if (!parsedId.success) {
    return { error: "Invalid request." };
  }

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", parsedId.data)
    .eq("user_id", user.id);

  if (error) {
    return { error: "Could not delete project." };
  }

  revalidatePath("/dashboard");
  return { success: true };
}
