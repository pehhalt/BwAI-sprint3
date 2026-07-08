import type { Note, Tag } from "@/app/lib/db";

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function filterNotes(
  notes: Note[],
  opts: {
    noteTags: Record<string, Tag[]>;
    activeTagIds: Set<string>;
    searchQuery: string;
  }
): Note[] {
  const query = opts.searchQuery.trim().toLowerCase();
  return notes.filter((note) => {
    if (opts.activeTagIds.size > 0) {
      const ids = new Set((opts.noteTags[note.id] ?? []).map((t) => t.id));
      if (![...opts.activeTagIds].every((id) => ids.has(id))) return false;
    }
    if (query) {
      const inTitle = note.title.toLowerCase().includes(query);
      const inBody = (note.body ?? "").toLowerCase().includes(query);
      if (!inTitle && !inBody) return false;
    }
    return true;
  });
}
