import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listBookmarks } from "@/app/lib/db";
import { logOutAction } from "@/app/auth/actions";
import { createBookmarkAction, deleteBookmarkAction } from "./actions";

export default async function BookmarksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const bookmarks = await listBookmarks();

  return (
    <main className="mx-auto max-w-lg p-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Your bookmarks</h1>
        <form action={logOutAction}>
          <button type="submit" className="underline text-sm">Log out</button>
        </form>
      </div>

      <form action={createBookmarkAction} className="flex gap-2 mb-6">
        <label htmlFor="title" className="sr-only">Title</label>
        <input id="title" name="title" placeholder="Title" required maxLength={200} className="border rounded p-2 flex-1" />
        <label htmlFor="url" className="sr-only">URL</label>
        <input id="url" name="url" type="url" placeholder="https://example.com" required maxLength={2048} className="border rounded p-2 flex-1" />
        <button type="submit" className="border rounded p-2">Save</button>
      </form>

      <ul className="flex flex-col gap-2">
        {bookmarks.map((b) => (
          <li key={b.id} className="border rounded p-2 flex justify-between items-center">
            <a href={b.url} className="underline">{b.title}</a>
            <form action={deleteBookmarkAction}>
              <input type="hidden" name="id" value={b.id} />
              <button type="submit" aria-label={`Delete ${b.title}`} className="text-sm underline">
                Delete
              </button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}
