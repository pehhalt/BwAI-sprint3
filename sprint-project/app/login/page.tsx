import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="mx-auto w-full max-w-[30rem] p-8">
      <h1 className="mb-1 text-xl font-semibold">Sign in</h1>
      <p className="mb-4 text-sm text-gray-600">
        Sign in to manage your script-rewriting projects.
      </p>
      <div className="rounded-xl border border-gray-400 p-[34px] shadow-sm">
        <LoginForm />
      </div>
      <Link href="/signup" className="mt-4 block text-sm underline">
        Need an account? Create one
      </Link>
    </main>
  );
}
