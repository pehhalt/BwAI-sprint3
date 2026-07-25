import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProjectCard } from "@/components/ProjectCard";
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
            className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white"
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </main>
  );
}
