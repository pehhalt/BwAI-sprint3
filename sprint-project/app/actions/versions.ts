"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { planApproval } from "@/lib/approval";
import type { RewriteVersionStatus } from "@/lib/types";

type ActionResult = { error?: string; success?: boolean };

export async function updateVersionText(
  projectId: string,
  sectionId: string,
  versionId: string,
  text: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const trimmed = text.trim();
  if (!trimmed) {
    return { error: "Rewrite text cannot be empty." };
  }

  const { data } = await supabase
    .from("rewrite_versions")
    .select("status")
    .eq("id", versionId)
    .single();

  const currentStatus =
    (data?.status as RewriteVersionStatus | undefined) ?? "draft";
  const nextStatus: RewriteVersionStatus =
    currentStatus === "approved" ? "approved" : "manually_edited";

  const { error } = await supabase
    .from("rewrite_versions")
    .update({ rewritten_text: trimmed, status: nextStatus })
    .eq("id", versionId);

  if (error) {
    return { error: "Could not save edits." };
  }

  revalidatePath(`/projects/${projectId}/sections/${sectionId}`);
  return { success: true };
}

export async function approveVersion(
  projectId: string,
  sectionId: string,
  versionId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: versions, error: fetchError } = await supabase
    .from("rewrite_versions")
    .select("id, status")
    .eq("section_id", sectionId);

  if (fetchError || !versions) {
    return { error: "Could not load versions." };
  }

  const plan = planApproval(
    versions as { id: string; status: RewriteVersionStatus }[],
    versionId
  );

  const orderedPlan = [
    ...plan.filter((version) => version.id !== versionId),
    ...plan.filter((version) => version.id === versionId),
  ];

  for (const version of orderedPlan) {
    const { error } = await supabase
      .from("rewrite_versions")
      .update({ status: version.status })
      .eq("id", version.id);
    if (error) {
      return { error: "Could not update approval state." };
    }
  }

  revalidatePath(`/projects/${projectId}/sections/${sectionId}`);
  return { success: true };
}
