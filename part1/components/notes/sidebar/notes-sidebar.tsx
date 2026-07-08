import { PlusIcon, FolderPlusIcon, XIcon, TagIcon, SearchIcon } from "lucide-react";
import type { Note, Collection, Tag } from "@/app/lib/db";
import { GroupHeader } from "@/components/notes/sidebar/group-header";
import { CollectionHeader } from "@/components/notes/sidebar/collection-header";
import { NoteList } from "@/components/notes/sidebar/note-list";

export function NotesSidebar({
  onNewNote,
  searchQuery,
  onSearchChange,
  searching,
  tags,
  activeTagIds,
  onToggleTagFilter,
  onClearTagFilter,
  uncollectedNotes,
  uncollectedExpanded,
  onToggleUncollected,
  collections,
  notesByCollection,
  expandedIds,
  onToggleCollection,
  renamingCollectionId,
  onStartRenameCollection,
  onConfirmRenameCollection,
  onCancelRenameCollection,
  noteTags,
  selectedId,
  onSelectNote,
  onNoteContextMenu,
  isFiltering,
  newCollectionName,
  onNewCollectionNameChange,
  showNewCollectionInput,
  onShowNewCollectionInput,
  onNewCollectionSubmit,
}: {
  onNewNote: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searching: boolean;
  tags: Tag[];
  activeTagIds: Set<string>;
  onToggleTagFilter: (tagId: string) => void;
  onClearTagFilter: () => void;
  uncollectedNotes: Note[];
  uncollectedExpanded: boolean;
  onToggleUncollected: () => void;
  collections: Collection[];
  notesByCollection: Record<string, Note[]>;
  expandedIds: Set<string>;
  onToggleCollection: (id: string) => void;
  renamingCollectionId: string | null;
  onStartRenameCollection: (id: string) => void;
  onConfirmRenameCollection: (id: string, name: string) => void;
  onCancelRenameCollection: () => void;
  noteTags: Record<string, Tag[]>;
  selectedId: string | null;
  onSelectNote: (id: string) => void;
  onNoteContextMenu: (e: React.MouseEvent, noteId: string) => void;
  isFiltering: boolean;
  newCollectionName: string;
  onNewCollectionNameChange: (name: string) => void;
  showNewCollectionInput: boolean;
  onShowNewCollectionInput: (show: boolean) => void;
  onNewCollectionSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <aside className="w-64 shrink-0 border-r flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-12 px-4 border-b flex items-center justify-between shrink-0">
        <span className="text-sm font-semibold">Notes</span>
        <button
          onClick={onNewNote}
          title="New note"
          className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          <PlusIcon size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col">
        {/* Search */}
        <div className="px-3 py-2 border-b shrink-0">
          <div className="relative">
            <SearchIcon
              size={13}
              className={`absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                searching ? "text-primary animate-pulse" : "text-muted-foreground"
              }`}
            />
            <input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search notes…"
              className="w-full pl-7 pr-6 py-1.5 text-xs border rounded bg-background outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <XIcon size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Tag filter */}
        <div className="px-3 pt-3 pb-2 border-b shrink-0">
          <div className="flex items-center gap-1.5 mb-2">
            <TagIcon size={11} className="text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Filter by tag
            </span>
            {activeTagIds.size > 0 && (
              <button
                onClick={onClearTagFilter}
                className="ml-auto text-[10px] text-muted-foreground hover:text-foreground underline"
              >
                Clear
              </button>
            )}
          </div>
          {tags.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              No tags yet — add one to a note
            </p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => onToggleTagFilter(tag.id)}
                  className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                    activeTagIds.has(tag.id)
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary/10 text-primary hover:bg-primary/20"
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Note groups */}
        <div className="flex-1">
          <NoteList
            header={
              <GroupHeader
                label="Uncollected"
                count={uncollectedNotes.length}
                expanded={uncollectedExpanded}
                onToggle={onToggleUncollected}
              />
            }
            notes={uncollectedNotes}
            noteTags={noteTags}
            expanded={uncollectedExpanded}
            isFiltering={isFiltering}
            emptyMessage="No uncollected notes"
            selectedId={selectedId}
            onSelectNote={onSelectNote}
            onContextMenu={onNoteContextMenu}
          />

          {collections.map((collection) => {
            const collNotes = notesByCollection[collection.id] ?? [];
            const expanded = expandedIds.has(collection.id);
            return (
              <NoteList
                key={collection.id}
                header={
                  <CollectionHeader
                    collection={collection}
                    count={collNotes.length}
                    expanded={expanded}
                    onToggle={() => onToggleCollection(collection.id)}
                    isRenaming={renamingCollectionId === collection.id}
                    onStartRename={() => onStartRenameCollection(collection.id)}
                    onConfirmRename={(name) => onConfirmRenameCollection(collection.id, name)}
                    onCancelRename={onCancelRenameCollection}
                  />
                }
                notes={collNotes}
                noteTags={noteTags}
                expanded={expanded}
                isFiltering={isFiltering}
                emptyMessage="No notes in this collection"
                selectedId={selectedId}
                onSelectNote={onSelectNote}
                onContextMenu={onNoteContextMenu}
              />
            );
          })}
        </div>

        {/* New collection */}
        <div className="px-3 py-3 border-t shrink-0">
          {showNewCollectionInput ? (
            <form onSubmit={onNewCollectionSubmit} className="flex gap-1">
              <input
                autoFocus
                value={newCollectionName}
                onChange={(e) => onNewCollectionNameChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    onShowNewCollectionInput(false);
                    onNewCollectionNameChange("");
                  }
                }}
                placeholder="Collection name…"
                className="flex-1 text-xs border rounded px-2 py-1 bg-background outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                type="submit"
                className="text-xs text-primary hover:underline px-1"
              >
                Add
              </button>
            </form>
          ) : (
            <button
              onClick={() => onShowNewCollectionInput(true)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <FolderPlusIcon size={13} />
              New collection
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
