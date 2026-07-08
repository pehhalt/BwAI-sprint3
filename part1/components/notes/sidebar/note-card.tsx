import type { Note, Tag } from "@/app/lib/db";
import { formatDate } from "@/components/notes/utils";
import { TagPill } from "@/components/notes/editor/tag-pill";

export function NoteCard({
  note,
  tags,
  selected,
  onClick,
  onContextMenu,
}: {
  note: Note;
  tags: Tag[];
  selected: boolean;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={`w-full text-left px-4 py-3 border-b hover:bg-accent transition-colors ${
        selected ? "bg-accent" : ""
      }`}
    >
      <p className="text-sm font-medium truncate">{note.title || "Untitled"}</p>
      <p className="text-xs text-muted-foreground truncate mt-0.5">
        {note.body?.trim() || "No content"}
      </p>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {tags.map((t) => (
            <TagPill key={t.id} tag={t} compact />
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground mt-1">
        {formatDate(note.updated_at)}
      </p>
    </button>
  );
}
