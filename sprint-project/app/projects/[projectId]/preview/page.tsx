import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DocumentPreview } from "@/components/DocumentPreview";
import type { Project, RewriteVersion, Section } from "@/lib/types";

export default async function PreviewPage({
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

  const { data: versionsData } = await supabase
    .from("rewrite_versions")
    .select("*")
    .eq("project_id", projectId)
    .eq("status", "approved");
  const approvedVersions = (versionsData ?? []) as RewriteVersion[];

  const approvedBySection = new Map(
    approvedVersions.map((version) => [version.section_id, version])
  );

  const approvedSections = sections
    .filter((section) => approvedBySection.has(section.id))
    .map((section) => ({
      section,
      version: approvedBySection.get(section.id)!,
    }));

  return <DocumentPreview project={project} sections={approvedSections} />;
}
