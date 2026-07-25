import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProjectSettingsForm } from "@/components/ProjectSettingsForm";
import type { Project } from "@/lib/types";

export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();
  const project = data as Project | null;
  if (!project) notFound();

  return (
    <main className="mx-auto max-w-lg p-6">
      <h1 className="mb-6 text-2xl font-semibold">Project settings</h1>
      <ProjectSettingsForm projectId={projectId} project={project} />
    </main>
  );
}
