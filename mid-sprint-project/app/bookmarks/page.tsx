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
      <div className="rounded-xl border-2 border-[var(--border)] shadow-sm p-[34px]">
        <div className="flex justify-between items-center mb-1">
          <h1 className="text-xl font-semibold">Your bookmarks</h1>
          <form action={logOutAction}>
            <button type="submit" className="underline text-sm">Log out</button>
          </form>
        </div>
        <p className="text-sm text-[var(--muted-foreground)] mb-4">
          Save a link with a title, then find it here anytime.
        </p>

        <form action={createBookmarkAction} className="flex gap-2 mb-6">
          <label htmlFor="title" className="sr-only">Title</label>
          <input id="title" name="title" placeholder="Title" required maxLength={200} className="border rounded p-2 flex-1 min-w-0" />
          <label htmlFor="url" className="sr-only">URL</label>
          <input id="url" name="url" type="url" placeholder="https://example.com" required maxLength={2048} className="border rounded p-2 flex-1 min-w-0" />
          <button type="submit" className="border rounded p-2 shrink-0">Save</button>
        </form>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="py-2 font-medium">Title</th>
              <th className="py-2 font-medium w-0"></th>
            </tr>
          </thead>
          <tbody>
            {bookmarks.map((b) => (
              <tr key={b.id} className="border-b border-[var(--border)] last:border-b-0">
                <td className="py-2 pr-2">
                  <a href={b.url} title={b.url} className="underline">{b.title}</a>
                </td>
                <td className="py-2 text-right whitespace-nowrap">
                  <form action={deleteBookmarkAction}>
                    <input type="hidden" name="id" value={b.id} />
                    <button type="submit" aria-label={`Delete ${b.title}`} className="text-sm underline">
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
