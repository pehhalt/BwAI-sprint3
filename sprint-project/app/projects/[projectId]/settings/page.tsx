import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProjectSettingsForm } from "@/components/ProjectSettingsForm";
import { SignOutButton } from "@/components/SignOutButton";
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
    <main className="mx-auto w-full max-w-[900px] p-6">
      <div className="mb-2 flex items-center justify-between">
        <Link
          href={`/projects/${projectId}`}
          className="text-sm text-gray-600 underline"
        >
          ← {project.title}
        </Link>
        <SignOutButton />
      </div>
      <h1 className="mb-6 text-2xl font-semibold">Project settings</h1>
      <ProjectSettingsForm projectId={projectId} project={project} />
    </main>
  );
}
