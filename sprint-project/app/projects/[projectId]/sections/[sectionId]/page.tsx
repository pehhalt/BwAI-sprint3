import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SourceEditor } from "@/components/SourceEditor";
import type { Section } from "@/lib/types";

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

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-semibold">{section.title}</h1>
      <div className="mt-6">
        <SourceEditor projectId={projectId} section={section} />
      </div>
    </main>
  );
}
