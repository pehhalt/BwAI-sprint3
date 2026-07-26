import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SectionForm } from "@/components/SectionForm";
import { DeleteSectionButton } from "@/components/DeleteSectionButton";
import { SignOutButton } from "@/components/SignOutButton";
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

  const { data: approvedData } = await supabase
    .from("rewrite_versions")
    .select("section_id")
    .eq("project_id", projectId)
    .eq("status", "approved");
  const approvedSectionIds = new Set(
    (approvedData ?? []).map((v) => v.section_id as string)
  );

  return (
    <main className="mx-auto w-full max-w-[1800px] p-6">
      <div className="mb-2 flex items-center justify-between">
        <Link href="/dashboard" className="text-sm text-gray-600 underline">
          ← Dashboard
        </Link>
        <SignOutButton />
      </div>
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-400 p-4">
          {sections.length === 0 ? (
            <p className="text-sm text-gray-500">No sections yet.</p>
          ) : (
            <table className="w-full border-collapse">
              <tbody>
                {sections.map((section, i) => (
                  <tr
                    key={section.id}
                    className={`[&:last-child>td]:border-b-0 ${i % 2 === 0 ? "bg-white" : "bg-gray-100"}`}
                  >
                    <td className="w-full border-b border-gray-200 px-4 py-2">
                      <Link
                        href={`/projects/${projectId}/sections/${section.id}`}
                        className="font-medium"
                      >
                        {section.title}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap border-b border-gray-200 px-4 py-2 text-right">
                      {approvedSectionIds.has(section.id) ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          Approved
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                          Not approved
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap border-b border-gray-200 px-4 py-2 text-right">
                      <DeleteSectionButton
                        projectId={projectId}
                        sectionId={section.id}
                        sectionTitle={section.title}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <SectionForm projectId={projectId} />
      </div>
    </main>
  );
}
