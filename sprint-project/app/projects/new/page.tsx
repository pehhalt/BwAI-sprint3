import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProjectForm } from "@/components/ProjectForm";

export default async function NewProjectPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto max-w-lg p-6">
      <h1 className="mb-6 text-2xl font-semibold">New project</h1>
      <ProjectForm />
    </main>
  );
}
