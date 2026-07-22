"use client";

import { useState } from "react";
import type { Note, Collection, Tag } from "@/app/lib/db";
import { useNotes } from "@/components/notes/hooks/use-notes";
import { useCollections } from "@/components/notes/hooks/use-collections";
import { useTags } from "@/components/notes/hooks/use-tags";
import { useSearch } from "@/components/notes/hooks/use-search";
import { NotesSidebar } from "@/components/notes/sidebar/notes-sidebar";
import { NoteEditor } from "@/components/notes/editor/note-editor";
import { ContextMenu } from "@/components/notes/sidebar/context-menu";
import { filterNotes } from "@/components/notes/utils";

export default function NotesWorkspace({
  initialNotes,
  initialCollections,
  initialTags,
  initialNoteTags,
}: {
  initialNotes: Note[];
  initialCollections: Collection[];
  initialTags: Tag[];
  initialNoteTags: Record<string, Tag[]>;
}) {
  const [error, setError] = useState<string | null>(null);

  const notesState = useNotes(initialNotes, setError);
  const collectionsState = useCollections(initialCollections, setError);
  const tagsState = useTags(
    initialTags,
    initialNoteTags,
    notesState.selectedId,
    setError
  );
  const searchState = useSearch(setError);

  const isFiltering = tagsState.activeTagIds.size > 0 || searchState.searchResults !== null;

  const filtered = filterNotes(notesState.notes, {
    noteTags: tagsState.noteTags,
    activeTagIds: tagsState.activeTagIds,
    searchResults: searchState.searchResults,
  });

  const uncollectedNotes = filtered.filter((n) => !n.collection_id);
  const notesByCollection: Record<string, Note[]> = {};
  for (const c of collectionsState.collections) {
    notesByCollection[c.id] = filtered.filter((n) => n.collection_id === c.id);
  }

  // Selecting/creating a note resets the tag-input UI, which lives in a
  // separate hook. Only reset when the underlying action actually happened —
  // re-clicking the already-selected note, or a failed create, is a no-op.
  async function selectNote(id: string) {
    const changed = await notesState.handleSelectNote(id);
    if (changed) {
      tagsState.setTagInput("");
      tagsState.setTagDropdownOpen(false);
    }
  }

  async function newNote() {
    const created = await notesState.handleNewNote();
    if (created) {
      tagsState.setTagInput("");
      tagsState.setTagDropdownOpen(false);
    }
  }

  async function deleteSelectedNote() {
    const idToDelete = notesState.selectedId;
    const deleted = await notesState.handleDelete();
    if (deleted && idToDelete) tagsState.clearNoteTags(idToDelete);
  }

  const contextMenu = notesState.contextMenu;

  return (
    <>
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          collections={collectionsState.collections}
          currentCollectionId={
            notesState.notes.find((n) => n.id === contextMenu.noteId)?.collection_id ?? null
          }
          onMove={(collectionId) => notesState.handleMoveNote(contextMenu.noteId, collectionId)}
          onClose={() => notesState.setContextMenu(null)}
        />
      )}
      <div className="flex h-full w-full overflow-hidden">
        <NotesSidebar
          onNewNote={newNote}
          searchQuery={searchState.searchQuery}
          onSearchChange={searchState.handleSearchChange}
          searching={searchState.searching}
          tags={tagsState.tags}
          activeTagIds={tagsState.activeTagIds}
          onToggleTagFilter={tagsState.toggleTagFilter}
          onClearTagFilter={tagsState.clearTagFilter}
          uncollectedNotes={uncollectedNotes}
          uncollectedExpanded={collectionsState.uncollectedExpanded}
          onToggleUncollected={collectionsState.toggleUncollectedExpanded}
          collections={collectionsState.collections}
          notesByCollection={notesByCollection}
          expandedIds={collectionsState.expandedIds}
          onToggleCollection={collectionsState.toggleCollection}
          renamingCollectionId={collectionsState.renamingCollectionId}
          onStartRenameCollection={collectionsState.startRenameCollection}
          onConfirmRenameCollection={collectionsState.handleRenameCollection}
          onCancelRenameCollection={collectionsState.cancelRenameCollection}
          noteTags={tagsState.noteTags}
          selectedId={notesState.selectedId}
          onSelectNote={selectNote}
          onNoteContextMenu={notesState.handleNoteContextMenu}
          isFiltering={isFiltering}
          newCollectionName={collectionsState.newCollectionName}
          onNewCollectionNameChange={collectionsState.setNewCollectionName}
          showNewCollectionInput={collectionsState.showNewCollectionInput}
          onShowNewCollectionInput={collectionsState.setShowNewCollectionInput}
          onNewCollectionSubmit={collectionsState.handleNewCollection}
        />

        <NoteEditor
          selectedNote={notesState.selectedNote}
          title={notesState.title}
          body={notesState.body}
          onTitleChange={notesState.handleTitleChange}
          onBodyChange={notesState.handleBodyChange}
          saving={notesState.saving}
          error={error}
          onDismissError={() => setError(null)}
          collections={collectionsState.collections}
          onAssignCollection={notesState.handleAssignCollection}
          onRefresh={notesState.handleRefresh}
          onDelete={deleteSelectedNote}
          onNewNote={newNote}
          selectedNoteTags={tagsState.selectedNoteTags}
          tagInput={tagsState.tagInput}
          onTagInputChange={tagsState.setTagInput}
          tagDropdownOpen={tagsState.tagDropdownOpen}
          onTagDropdownOpenChange={tagsState.setTagDropdownOpen}
          tagSuggestions={tagsState.tagSuggestions}
          onAddTag={tagsState.handleAddTag}
          onRemoveTag={tagsState.handleRemoveTag}
        />
      </div>
    </>
  );
}
