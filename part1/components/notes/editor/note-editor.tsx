import { Trash2Icon, DownloadIcon } from "lucide-react";
import type { Note, Collection, Tag } from "@/app/lib/db";
import { TagEditor } from "@/components/notes/editor/tag-editor";

function exportAsMarkdown(title: string, body: string) {
  const content = `# ${title}\n\n${body}`;
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title || "untitled"}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

export function NoteEditor({
  selectedNote,
  title,
  body,
  onTitleChange,
  onBodyChange,
  saving,
  error,
  onDismissError,
  collections,
  onAssignCollection,
  onRefresh,
  onDelete,
  onNewNote,
  selectedNoteTags,
  tagInput,
  onTagInputChange,
  tagDropdownOpen,
  onTagDropdownOpenChange,
  tagSuggestions,
  onAddTag,
  onRemoveTag,
}: {
  selectedNote: Note | null;
  title: string;
  body: string;
  onTitleChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  saving: boolean;
  error: string | null;
  onDismissError: () => void;
  collections: Collection[];
  onAssignCollection: (collectionId: string | null) => void;
  onRefresh: () => void;
  onDelete: () => void;
  onNewNote: () => void;
  selectedNoteTags: Tag[];
  tagInput: string;
  onTagInputChange: (value: string) => void;
  tagDropdownOpen: boolean;
  onTagDropdownOpenChange: (open: boolean) => void;
  tagSuggestions: Tag[];
  onAddTag: (name: string) => void;
  onRemoveTag: (tagId: string) => void;
}) {
  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      {error && (
        <div className="px-6 py-2 bg-destructive/10 text-destructive text-sm flex justify-between shrink-0">
          <span>{error}</span>
          <button onClick={onDismissError} className="hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {selectedNote ? (
        <>
          {/* Toolbar */}
          <div className="h-12 px-6 border-b flex items-center gap-4 shrink-0">
            <span className="text-xs text-muted-foreground w-12 shrink-0">
              {saving ? "Saving…" : "Saved"}
            </span>

            <select
              value={selectedNote.collection_id ?? ""}
              onChange={(e) => onAssignCollection(e.target.value || null)}
              className="flex-1 max-w-48 text-xs border rounded px-2 py-1 bg-background outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">No collection</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={onRefresh}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Refresh
              </button>
              <button
                onClick={() => exportAsMarkdown(title, body)}
                title="Export as Markdown"
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <DownloadIcon size={16} />
              </button>
              <button
                onClick={onDelete}
                title="Delete note"
                className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2Icon size={16} />
              </button>
            </div>
          </div>

          {/* Editor body */}
          <div className="flex-1 flex flex-col p-8 gap-4 overflow-y-auto">
            <input
              className="text-2xl font-bold bg-transparent border-none outline-none w-full placeholder:text-muted-foreground/50"
              placeholder="Untitled"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
            />
            <textarea
              className="flex-1 min-h-48 bg-transparent border-none outline-none resize-none text-sm leading-relaxed placeholder:text-muted-foreground/50"
              placeholder="Start writing…"
              value={body}
              onChange={(e) => onBodyChange(e.target.value)}
            />

            <TagEditor
              selectedNoteTags={selectedNoteTags}
              tagInput={tagInput}
              onTagInputChange={onTagInputChange}
              tagDropdownOpen={tagDropdownOpen}
              onTagDropdownOpenChange={onTagDropdownOpenChange}
              tagSuggestions={tagSuggestions}
              onAddTag={onAddTag}
              onRemoveTag={onRemoveTag}
            />
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <p className="text-sm">No note selected</p>
          <button
            onClick={onNewNote}
            className="text-sm text-primary hover:underline"
          >
            Create your first note
          </button>
        </div>
      )}
    </main>
  );
}
