import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getNotes, getCollections, getTags, getNoteTags, type Tag } from "@/app/lib/db";
import NotesWorkspace from "@/components/notes/notes-workspace";
import NotesSkeleton from "@/components/notes/notes-skeleton";

async function NotesLoader() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const [notes, collections, tags, noteTagRows] = await Promise.all([
    getNotes(supabase),
    getCollections(supabase),
    getTags(supabase),
    getNoteTags(supabase),
  ]);

  // Build noteId → Tag[] map
  const noteTagsMap: Record<string, Tag[]> = {};
  for (const { note_id, tag } of noteTagRows) {
    if (!noteTagsMap[note_id]) noteTagsMap[note_id] = [];
    noteTagsMap[note_id].push(tag);
  }

  return (
    <NotesWorkspace
      initialNotes={notes}
      initialCollections={collections}
      initialTags={tags}
      initialNoteTags={noteTagsMap}
    />
  );
}

export default function ProtectedPage() {
  return (
    <Suspense fallback={<NotesSkeleton />}>
      <NotesLoader />
    </Suspense>
  );
}
