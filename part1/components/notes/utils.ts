import type { Note, Tag } from "@/app/lib/db";

export function formatDate(iso: string) {
  // Pinned to a fixed locale rather than the runtime default: the server
  // (Node) and client (browser) can resolve different default locales,
  // producing different formatted strings for the same date and causing
  // a hydration mismatch on every page load.
  return new Date(iso).toLocaleDateString("en-US", {
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
