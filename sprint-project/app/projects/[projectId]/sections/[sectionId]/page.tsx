import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SourceEditor } from "@/components/SourceEditor";
import { RewriteEditor } from "@/components/RewriteEditor";
import { VersionList } from "@/components/VersionList";
import type { RewriteVersion, Section } from "@/lib/types";

export default async function SectionPage({
  params,
}: {
  params: Promise<{ projectId: string; sectionId: string }>;
}) {
  const { projectId, sectionId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("sections")
    .select("*")
    .eq("id", sectionId)
    .eq("project_id", projectId)
    .single();
  const section = data as Section | null;
  if (!section) notFound();

  const { data: versionsData } = await supabase
    .from("rewrite_versions")
    .select("*")
    .eq("section_id", sectionId)
    .order("created_at", { ascending: false });
  const versions = (versionsData ?? []) as RewriteVersion[];
  const latestVersion = versions[0] ?? null;

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-semibold">{section.title}</h1>
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SourceEditor projectId={projectId} section={section} />
        <RewriteEditor
          projectId={projectId}
          sectionId={sectionId}
          latestVersion={latestVersion}
        />
      </div>
      <div className="mt-8">
        <VersionList
          projectId={projectId}
          sectionId={sectionId}
          versions={versions}
        />
      </div>
    </main>
  );
}
