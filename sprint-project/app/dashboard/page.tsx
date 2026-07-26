import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProjectRow } from "@/components/ProjectRow";
import { SignOutButton } from "@/components/SignOutButton";
import type { Project } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });
  const projects = (data ?? []) as Project[];

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your projects</h1>
        <div className="flex items-center gap-4">
          <Link
            href="/projects/new"
            className="rounded bg-blue-800 px-3 py-1.5 text-sm text-white"
          >
            New project
          </Link>
          <SignOutButton />
        </div>
      </div>

      {projects.length === 0 ? (
        <p className="text-sm text-gray-500">
          No projects yet. Create your first one.
        </p>
      ) : (
        <div className="rounded-lg border border-gray-400 p-4">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="border-b border-gray-200 px-4 py-2 text-sm font-medium text-gray-700">
                  Title
                </th>
                <th className="border-b border-gray-200 px-4 py-2 text-sm font-medium text-gray-700">
                  Target audience
                </th>
                <th className="border-b border-gray-200 px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project, i) => (
                <ProjectRow key={project.id} project={project} index={i} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
