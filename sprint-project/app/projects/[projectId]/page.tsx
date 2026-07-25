import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Project } from "@/lib/types";

export default async function ProjectPage({
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
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{project.title}</h1>
        <div className="flex items-center gap-4 text-sm">
          <Link href={`/projects/${projectId}/settings`} className="underline">
            Settings
          </Link>
          <Link href={`/projects/${projectId}/preview`} className="underline">
            Preview
          </Link>
        </div>
      </div>
      <p className="text-sm text-gray-500">Sections coming in Task 9.</p>
    </main>
  );
}
