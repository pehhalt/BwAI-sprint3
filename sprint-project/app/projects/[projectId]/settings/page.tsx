import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateProjectSettings } from "@/app/actions/projects";
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

  async function save(formData: FormData) {
    "use server";
    await updateProjectSettings(projectId, formData);
  }

  return (
    <main className="mx-auto max-w-lg p-6">
      <h1 className="mb-6 text-2xl font-semibold">Project settings</h1>
      <form action={save} className="flex flex-col gap-3">
        <label htmlFor="title" className="text-sm text-gray-600">
          Title
        </label>
        <input
          id="title"
          name="title"
          defaultValue={project.title}
          required
          className="rounded border border-gray-300 p-2 text-sm"
        />

        <label htmlFor="target_audience" className="text-sm text-gray-600">
          Target audience
        </label>
        <textarea
          id="target_audience"
          name="target_audience"
          defaultValue={project.target_audience}
          rows={2}
          className="rounded border border-gray-300 p-2 text-sm"
        />

        <label htmlFor="global_instructions" className="text-sm text-gray-600">
          Project-wide rewriting rules
        </label>
        <textarea
          id="global_instructions"
          name="global_instructions"
          defaultValue={project.global_instructions}
          rows={4}
          className="rounded border border-gray-300 p-2 text-sm"
        />

        <button
          type="submit"
          className="self-start rounded bg-blue-600 px-3 py-1.5 text-sm text-white"
        >
          Save settings
        </button>
      </form>
    </main>
  );
}
