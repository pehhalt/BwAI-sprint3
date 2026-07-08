import type { ReactNode } from "react";
import type { Note, Tag } from "@/app/lib/db";
import { NoteCard } from "@/components/notes/sidebar/note-card";

export function NoteList({
  header,
  notes,
  noteTags,
  expanded,
  isFiltering,
  emptyMessage,
  selectedId,
  onSelectNote,
  onContextMenu,
}: {
  header: ReactNode;
  notes: Note[];
  noteTags: Record<string, Tag[]>;
  expanded: boolean;
  isFiltering: boolean;
  emptyMessage: string;
  selectedId: string | null;
  onSelectNote: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, noteId: string) => void;
}) {
  return (
    <div>
      {header}
      {(expanded || isFiltering) &&
        (notes.length === 0 ? (
          <p className="px-6 py-2 text-xs text-muted-foreground italic">
            {isFiltering ? "No matches" : emptyMessage}
          </p>
        ) : (
          notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              tags={noteTags[note.id] ?? []}
              selected={selectedId === note.id}
              onClick={() => onSelectNote(note.id)}
              onContextMenu={(e) => onContextMenu(e, note.id)}
            />
          ))
        ))}
    </div>
  );
}
