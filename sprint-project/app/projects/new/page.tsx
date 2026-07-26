import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProjectForm } from "@/components/ProjectForm";
import { SignOutButton } from "@/components/SignOutButton";

export default async function NewProjectPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto max-w-lg p-6">
      <div className="mb-2 flex items-center justify-between">
        <Link href="/dashboard" className="text-sm text-gray-600 underline">
          ← Dashboard
        </Link>
        <SignOutButton />
      </div>
      <h1 className="mb-6 text-2xl font-semibold">New project</h1>
      <ProjectForm />
    </main>
  );
}
