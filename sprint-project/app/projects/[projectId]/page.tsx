import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SectionForm } from "@/components/SectionForm";
import type { Project, Section } from "@/lib/types";

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

  const { data: projectData } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();
  const project = projectData as Project | null;
  if (!project) notFound();

  const { data: sectionsData } = await supabase
    .from("sections")
    .select("*")
    .eq("project_id", projectId)
    .order("position", { ascending: true });
  const sections = (sectionsData ?? []) as Section[];

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

      <ul className="mb-8 flex flex-col gap-2">
        {sections.map((section) => (
          <li key={section.id}>
            <Link
              href={`/projects/${projectId}/sections/${section.id}`}
              className="block rounded border border-gray-200 p-3 hover:border-gray-400"
            >
              {section.title}
            </Link>
          </li>
        ))}
      </ul>

      <SectionForm projectId={projectId} />
    </main>
  );
}
