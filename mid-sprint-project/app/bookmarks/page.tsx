import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logOutAction } from "@/app/auth/actions";

export default async function BookmarksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto max-w-lg p-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Your bookmarks</h1>
        <form action={logOutAction}>
          <button type="submit" className="underline text-sm">Log out</button>
        </form>
      </div>
      <p className="text-sm text-gray-500">Save/list/delete lands in Task 6.</p>
    </main>
  );
}
