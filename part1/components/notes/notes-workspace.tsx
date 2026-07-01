"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getNotes,
  searchNotes,
  createNote,
  updateNote,
  deleteNote,
  createCollection,
  renameCollection,
  createTag,
  addTagToNote,
  removeTagFromNote,
  type Note,
  type Collection,
  type Tag,
} from "@/app/lib/db";
import {
  PlusIcon,
  Trash2Icon,
  ChevronRightIcon,
  ChevronDownIcon,
  FolderPlusIcon,
  XIcon,
  TagIcon,
  SearchIcon,
  PencilIcon,
  DownloadIcon,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TagPill({
  tag,
  onRemove,
}: {
  tag: Tag;
  onRemove?: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
      {tag.name}
      {onRemove && (
        <button
          onClick={onRemove}
          className="hover:text-destructive transition-colors"
          aria-label={`Remove tag ${tag.name}`}
        >
          <XIcon size={10} />
        </button>
      )}
    </span>
  );
}

function NoteCard({
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
            <span
              key={t.id}
              className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium"
            >
              {t.name}
            </span>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground mt-1">
        {formatDate(note.updated_at)}
      </p>
    </button>
  );
}

function GroupHeader({
  label,
  count,
  expanded,
  onToggle,
}: {
  label: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground uppercase tracking-wide transition-colors"
    >
      {expanded ? <ChevronDownIcon size={12} /> : <ChevronRightIcon size={12} />}
      <span className="flex-1 text-left truncate">{label}</span>
      <span className="font-normal">{count}</span>
    </button>
  );
}

function CollectionHeader({
  collection,
  count,
  expanded,
  onToggle,
  isRenaming,
  onStartRename,
  onConfirmRename,
  onCancelRename,
}: {
  collection: Collection;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  isRenaming: boolean;
  onStartRename: () => void;
  onConfirmRename: (name: string) => void;
  onCancelRename: () => void;
}) {
  const [value, setValue] = useState(collection.name);
  const committedRef = useRef(false);

  useEffect(() => {
    if (isRenaming) {
      setValue(collection.name);
      committedRef.current = false;
    }
  }, [isRenaming, collection.name]);

  if (isRenaming) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-2">
        <button onClick={onToggle} className="shrink-0 text-muted-foreground">
          {expanded ? <ChevronDownIcon size={12} /> : <ChevronRightIcon size={12} />}
        </button>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              committedRef.current = true;
              onConfirmRename(value);
            }
            if (e.key === "Escape") {
              committedRef.current = true;
              onCancelRename();
            }
          }}
          onBlur={() => {
            if (!committedRef.current) onConfirmRename(value);
          }}
          className="flex-1 min-w-0 text-xs font-semibold uppercase tracking-wide border rounded px-1 py-0.5 bg-background outline-none focus:ring-1 focus:ring-ring"
        />
        <span className="text-xs font-normal text-muted-foreground shrink-0">
          {count}
        </span>
      </div>
    );
  }

  return (
    <div className="group flex items-center">
      <button
        onClick={onToggle}
        className="flex-1 flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground uppercase tracking-wide transition-colors"
      >
        {expanded ? <ChevronDownIcon size={12} /> : <ChevronRightIcon size={12} />}
        <span className="flex-1 text-left truncate">{collection.name}</span>
        <span className="font-normal">{count}</span>
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onStartRename(); }}
        title="Rename collection"
        className="shrink-0 pr-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
      >
        <PencilIcon size={11} />
      </button>
    </div>
  );
}

function ContextMenu({
  x,
  y,
  collections,
  currentCollectionId,
  onMove,
  onClose,
}: {
  x: number;
  y: number;
  collections: Collection[];
  currentCollectionId: string | null;
  onMove: (collectionId: string | null) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onClick = () => onClose();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const targets = collections.filter((c) => c.id !== currentCollectionId);

  return (
    <div
      style={{ position: "fixed", top: y, left: x, zIndex: 50 }}
      className="border rounded-md bg-background shadow-lg py-1 min-w-44"
      onClick={(e) => e.stopPropagation()}
    >
      <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Move to
      </p>
      {currentCollectionId !== null && (
        <button
          onClick={() => onMove(null)}
          className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent transition-colors"
        >
          Uncollected
        </button>
      )}
      {targets.length === 0 && currentCollectionId === null ? (
        <p className="px-3 py-1.5 text-xs text-muted-foreground italic">
          No collections yet
        </p>
      ) : (
        targets.map((c) => (
          <button
            key={c.id}
            onClick={() => onMove(c.id)}
            className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent transition-colors"
          >
            {c.name}
          </button>
        ))
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

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
  const supabase = createClient();

  // ── Note state ───────────────────────────────────────────────────────────
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialNotes[0]?.id ?? null
  );
  const [title, setTitle] = useState(initialNotes[0]?.title ?? "");
  const [body, setBody] = useState(initialNotes[0]?.body ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef<{ id: string; title: string; body: string } | null>(null);

  // ── Collection state ─────────────────────────────────────────────────────
  const [collections, setCollections] = useState<Collection[]>(initialCollections);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [uncollectedExpanded, setUncollectedExpanded] = useState(true);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [showNewCollectionInput, setShowNewCollectionInput] = useState(false);
  const [renamingCollectionId, setRenamingCollectionId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    noteId: string;
    x: number;
    y: number;
  } | null>(null);

  // ── Search state ─────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Note[] | null>(null);
  const [searching, setSearching] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Tag state ────────────────────────────────────────────────────────────
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [noteTags, setNoteTags] = useState<Record<string, Tag[]>>(initialNoteTags);
  const [activeTagIds, setActiveTagIds] = useState<Set<string>>(new Set());
  const [tagInput, setTagInput] = useState("");
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);

  // ── Derived ──────────────────────────────────────────────────────────────
  const selectedNote = notes.find((n) => n.id === selectedId) ?? null;
  const selectedNoteTags = selectedNote ? (noteTags[selectedNote.id] ?? []) : [];

  function notePassesFilter(note: Note): boolean {
    if (activeTagIds.size > 0) {
      const ids = new Set((noteTags[note.id] ?? []).map((t) => t.id));
      if (![...activeTagIds].every((id) => ids.has(id))) return false;
    }
    if (searchResults !== null) {
      return searchResults.some((r) => r.id === note.id);
    }
    return true;
  }

  const uncollectedNotes = notes.filter((n) => !n.collection_id && notePassesFilter(n));
  const notesInCollection = (cid: string) =>
    notes.filter((n) => n.collection_id === cid && notePassesFilter(n));

  // Tag input autocomplete: tags not yet on this note, matching the input
  const tagSuggestions = tags.filter(
    (t) =>
      !selectedNoteTags.some((st) => st.id === t.id) &&
      t.name.toLowerCase().includes(tagInput.toLowerCase()) &&
      tagInput.trim().length > 0
  );

  // ── Save logic ───────────────────────────────────────────────────────────
  async function flushPendingSave() {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (!dirtyRef.current) return;
    const { id, title: t, body: b } = dirtyRef.current;
    dirtyRef.current = null;
    try {
      const updated = await updateNote(supabase, id, { title: t, body: b });
      setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
    } catch (e) {
      console.error("Save failed:", e);
      setError("Failed to save. Please try again.");
    }
  }

  function scheduleSave(id: string, t: string, b: string) {
    dirtyRef.current = { id, title: t, body: b };
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      saveTimerRef.current = null;
      if (dirtyRef.current?.id !== id) return;
      const pending = dirtyRef.current;
      dirtyRef.current = null;
      setSaving(true);
      try {
        const updated = await updateNote(supabase, id, {
          title: pending.title,
          body: pending.body,
        });
        setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
      } catch (e) {
        console.error("Save failed:", e);
      setError("Failed to save. Please try again.");
      } finally {
        setSaving(false);
      }
    }, 800);
  }

  // ── Note handlers ────────────────────────────────────────────────────────
  async function handleSelectNote(id: string) {
    if (id === selectedId) return;
    await flushPendingSave();
    setTagInput("");
    setTagDropdownOpen(false);
    const note = notes.find((n) => n.id === id)!;
    setSelectedId(id);
    setTitle(note.title);
    setBody(note.body ?? "");
  }

  function handleTitleChange(value: string) {
    setTitle(value);
    if (selectedId) scheduleSave(selectedId, value, body);
  }

  function handleBodyChange(value: string) {
    setBody(value);
    if (selectedId) scheduleSave(selectedId, title, value);
  }

  async function handleNewNote() {
    try {
      await flushPendingSave();
      const note = await createNote(supabase, "Untitled", "");
      setNotes((prev) => [note, ...prev]);
      setSelectedId(note.id);
      setTitle(note.title);
      setBody("");
      setTagInput("");
    } catch {
      setError("Failed to create note.");
    }
  }

  async function handleDelete() {
    if (!selectedId) return;
    const idToDelete = selectedId;
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    dirtyRef.current = null;
    try {
      await deleteNote(supabase, idToDelete);
      const remaining = notes.filter((n) => n.id !== idToDelete);
      setNotes(remaining);
      setNoteTags((prev) => {
        const next = { ...prev };
        delete next[idToDelete];
        return next;
      });
      const next = remaining[0] ?? null;
      setSelectedId(next?.id ?? null);
      setTitle(next?.title ?? "");
      setBody(next?.body ?? "");
    } catch {
      setError("Failed to delete note.");
    }
  }

  async function handleAssignCollection(collectionId: string | null) {
    if (!selectedId) return;
    try {
      const updated = await updateNote(supabase, selectedId, {
        collection_id: collectionId,
      });
      setNotes((prev) => prev.map((n) => (n.id === selectedId ? updated : n)));
    } catch {
      setError("Failed to assign collection.");
    }
  }

  function handleNoteContextMenu(e: React.MouseEvent, noteId: string) {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ noteId, x: e.clientX, y: e.clientY });
  }

  async function handleMoveNote(noteId: string, collectionId: string | null) {
    setContextMenu(null);
    try {
      const updated = await updateNote(supabase, noteId, {
        collection_id: collectionId,
      });
      setNotes((prev) => prev.map((n) => (n.id === noteId ? updated : n)));
    } catch {
      setError("Failed to move note.");
    }
  }

  function handleSearchChange(query: string) {
    setSearchQuery(query);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (query.trim().length < 2) {
      setSearchResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchNotes(supabase, query.trim());
        setSearchResults(results);
      } catch {
        setError("Search failed.");
        setSearchResults(null);
      } finally {
        setSearching(false);
      }
    }, 300);
  }

  async function handleRefresh() {
    try {
      const fresh = await getNotes(supabase);
      setNotes(fresh);
    } catch {
      setError("Failed to load notes.");
    }
  }

  // ── Collection handlers ──────────────────────────────────────────────────
  function toggleCollection(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleRenameCollection(id: string, newName: string) {
    const name = newName.trim();
    setRenamingCollectionId(null);
    if (!name || name === collections.find((c) => c.id === id)?.name) return;
    try {
      const updated = await renameCollection(supabase, id, name);
      setCollections((prev) =>
        prev.map((c) => (c.id === id ? updated : c))
            .sort((a, b) => a.name.localeCompare(b.name))
      );
    } catch {
      setError("Failed to rename collection.");
    }
  }

  async function handleNewCollection(e: React.FormEvent) {
    e.preventDefault();
    const name = newCollectionName.trim();
    if (!name) return;
    try {
      const collection = await createCollection(supabase, name);
      setCollections((prev) =>
        [...prev, collection].sort((a, b) => a.name.localeCompare(b.name))
      );
      setExpandedIds((prev) => new Set(prev).add(collection.id));
      setNewCollectionName("");
      setShowNewCollectionInput(false);
    } catch {
      setError("Failed to create collection.");
    }
  }

  // ── Tag handlers ─────────────────────────────────────────────────────────
  function toggleTagFilter(tagId: string) {
    setActiveTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      return next;
    });
  }

  async function handleAddTag(tagName: string) {
    if (!selectedId || !tagName.trim()) return;
    const name = tagName.trim();

    // Check if tag already on this note
    if (selectedNoteTags.some((t) => t.name.toLowerCase() === name.toLowerCase()))
      return;

    try {
      // Find or create the tag
      let tag = tags.find((t) => t.name.toLowerCase() === name.toLowerCase());
      if (!tag) {
        tag = await createTag(supabase, name);
        setTags((prev) => [...prev, tag!].sort((a, b) => a.name.localeCompare(b.name)));
      }

      await addTagToNote(supabase, selectedId, tag.id);
      setNoteTags((prev) => ({
        ...prev,
        [selectedId]: [...(prev[selectedId] ?? []), tag!],
      }));
      setTagInput("");
      setTagDropdownOpen(false);
    } catch {
      setError("Failed to add tag.");
    }
  }

  async function handleRemoveTag(tagId: string) {
    if (!selectedId) return;
    try {
      await removeTagFromNote(supabase, selectedId, tagId);
      setNoteTags((prev) => ({
        ...prev,
        [selectedId]: (prev[selectedId] ?? []).filter((t) => t.id !== tagId),
      }));
    } catch {
      setError("Failed to remove tag.");
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
    {contextMenu && (
      <ContextMenu
        x={contextMenu.x}
        y={contextMenu.y}
        collections={collections}
        currentCollectionId={
          notes.find((n) => n.id === contextMenu.noteId)?.collection_id ?? null
        }
        onMove={(collectionId) => handleMoveNote(contextMenu.noteId, collectionId)}
        onClose={() => setContextMenu(null)}
      />
    )}
    <div className="flex h-full w-full overflow-hidden">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-64 shrink-0 border-r flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-12 px-4 border-b flex items-center justify-between shrink-0">
          <span className="text-sm font-semibold">Notes</span>
          <button
            onClick={handleNewNote}
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
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search notes…"
                className="w-full pl-7 pr-6 py-1.5 text-xs border rounded bg-background outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearchChange("")}
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
                  onClick={() => setActiveTagIds(new Set())}
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
                    onClick={() => toggleTagFilter(tag.id)}
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
            {/* Uncollected */}
            <div>
              <GroupHeader
                label="Uncollected"
                count={uncollectedNotes.length}
                expanded={uncollectedExpanded}
                onToggle={() => setUncollectedExpanded((v) => !v)}
              />
              {(uncollectedExpanded || searchResults !== null || activeTagIds.size > 0) &&
                (uncollectedNotes.length === 0 ? (
                  <p className="px-6 py-2 text-xs text-muted-foreground italic">
                    {activeTagIds.size > 0 || searchResults !== null || activeTagIds.size > 0 ? "No matches" : "No uncollected notes"}
                  </p>
                ) : (
                  uncollectedNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      tags={noteTags[note.id] ?? []}
                      selected={selectedId === note.id}
                      onClick={() => handleSelectNote(note.id)}
                      onContextMenu={(e) => handleNoteContextMenu(e, note.id)}
                    />
                  ))
                ))}
            </div>

            {/* Named collections */}
            {collections.map((collection) => {
              const collNotes = notesInCollection(collection.id);
              const expanded = expandedIds.has(collection.id);
              return (
                <div key={collection.id}>
                  <CollectionHeader
                    collection={collection}
                    count={collNotes.length}
                    expanded={expanded}
                    onToggle={() => toggleCollection(collection.id)}
                    isRenaming={renamingCollectionId === collection.id}
                    onStartRename={() => setRenamingCollectionId(collection.id)}
                    onConfirmRename={(name) => handleRenameCollection(collection.id, name)}
                    onCancelRename={() => setRenamingCollectionId(null)}
                  />
                  {(expanded || searchResults !== null || activeTagIds.size > 0) &&
                    (collNotes.length === 0 ? (
                      <p className="px-6 py-2 text-xs text-muted-foreground italic">
                        {activeTagIds.size > 0 || searchResults !== null || activeTagIds.size > 0 ? "No matches" : "No notes in this collection"}
                      </p>
                    ) : (
                      collNotes.map((note) => (
                        <NoteCard
                          key={note.id}
                          note={note}
                          tags={noteTags[note.id] ?? []}
                          selected={selectedId === note.id}
                          onClick={() => handleSelectNote(note.id)}
                          onContextMenu={(e) => handleNoteContextMenu(e, note.id)}
                        />
                      ))
                    ))}
                </div>
              );
            })}
          </div>

          {/* New collection */}
          <div className="px-3 py-3 border-t shrink-0">
            {showNewCollectionInput ? (
              <form onSubmit={handleNewCollection} className="flex gap-1">
                <input
                  autoFocus
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setShowNewCollectionInput(false);
                      setNewCollectionName("");
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
                onClick={() => setShowNewCollectionInput(true)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <FolderPlusIcon size={13} />
                New collection
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ── Editor ──────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {error && (
          <div className="px-6 py-2 bg-destructive/10 text-destructive text-sm flex justify-between shrink-0">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="hover:underline">
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
                onChange={(e) => handleAssignCollection(e.target.value || null)}
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
                  onClick={handleRefresh}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Refresh
                </button>
                <button
                  onClick={() => {
                    const content = `# ${title}\n\n${body}`;
                    const blob = new Blob([content], { type: "text/markdown" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${title || "untitled"}.md`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  title="Export as Markdown"
                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <DownloadIcon size={16} />
                </button>
                <button
                  onClick={handleDelete}
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
                onChange={(e) => handleTitleChange(e.target.value)}
              />
              <textarea
                className="flex-1 min-h-48 bg-transparent border-none outline-none resize-none text-sm leading-relaxed placeholder:text-muted-foreground/50"
                placeholder="Start writing…"
                value={body}
                onChange={(e) => handleBodyChange(e.target.value)}
              />

              {/* Tag section */}
              <div className="border-t pt-4 flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <TagIcon size={13} className="text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Tags
                  </span>
                </div>

                {/* Current tags */}
                {selectedNoteTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedNoteTags.map((tag) => (
                      <TagPill
                        key={tag.id}
                        tag={tag}
                        onRemove={() => handleRemoveTag(tag.id)}
                      />
                    ))}
                  </div>
                )}

                {/* Add tag input */}
                <div className="relative">
                  <input
                    value={tagInput}
                    onChange={(e) => {
                      setTagInput(e.target.value);
                      setTagDropdownOpen(e.target.value.trim().length > 0);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag(tagInput);
                      }
                      if (e.key === "Escape") {
                        setTagInput("");
                        setTagDropdownOpen(false);
                      }
                    }}
                    onFocus={() => {
                      if (tagInput.trim()) setTagDropdownOpen(true);
                    }}
                    onBlur={() => setTimeout(() => setTagDropdownOpen(false), 150)}
                    placeholder="Add a tag…"
                    className="w-full max-w-56 text-xs border rounded px-2 py-1 bg-background outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
                  />

                  {tagDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-56 border rounded bg-background shadow-md z-10 overflow-hidden">
                      {tagSuggestions.length > 0 ? (
                        tagSuggestions.map((tag) => (
                          <button
                            key={tag.id}
                            onMouseDown={() => handleAddTag(tag.name)}
                            className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent transition-colors"
                          >
                            {tag.name}
                          </button>
                        ))
                      ) : (
                        <button
                          onMouseDown={() => handleAddTag(tagInput)}
                          className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent transition-colors text-muted-foreground"
                        >
                          Create &ldquo;{tagInput.trim()}&rdquo;
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <p className="text-sm">No note selected</p>
            <button
              onClick={handleNewNote}
              className="text-sm text-primary hover:underline"
            >
              Create your first note
            </button>
          </div>
        )}
      </main>
    </div>
    </>
  );
}
