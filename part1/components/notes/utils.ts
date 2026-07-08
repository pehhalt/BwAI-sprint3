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
    searchResults: Note[] | null;
  }
): Note[] {
  return notes.filter((note) => {
    if (opts.activeTagIds.size > 0) {
      const ids = new Set((opts.noteTags[note.id] ?? []).map((t) => t.id));
      if (![...opts.activeTagIds].every((id) => ids.has(id))) return false;
    }
    if (opts.searchResults !== null) {
      return opts.searchResults.some((r) => r.id === note.id);
    }
    return true;
  });
}
