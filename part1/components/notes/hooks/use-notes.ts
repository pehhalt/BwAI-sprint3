import { useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getNotes, createNote, updateNote, deleteNote, type Note } from "@/app/lib/db";

export function useNotes(
  supabase: SupabaseClient,
  initialNotes: Note[],
  onError: (msg: string) => void
) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialNotes[0]?.id ?? null
  );
  const [title, setTitle] = useState(initialNotes[0]?.title ?? "");
  const [body, setBody] = useState(initialNotes[0]?.body ?? "");
  const [saving, setSaving] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    noteId: string;
    x: number;
    y: number;
  } | null>(null);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef<{ id: string; title: string; body: string } | null>(null);

  const selectedNote = notes.find((n) => n.id === selectedId) ?? null;

  // Shared by the immediate flush and the debounced autosave so both paths
  // commit/merge/report errors identically.
  async function commitSave(id: string, t: string, b: string) {
    try {
      const updated = await updateNote(supabase, id, { title: t, body: b });
      setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
    } catch (e) {
      console.error("Save failed:", e);
      onError("Failed to save. Please try again.");
    }
  }

  async function flushPendingSave() {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (!dirtyRef.current) return;
    const { id, title: t, body: b } = dirtyRef.current;
    dirtyRef.current = null;
    await commitSave(id, t, b);
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
        await commitSave(pending.id, pending.title, pending.body);
      } finally {
        setSaving(false);
      }
    }, 800);
  }

  async function handleSelectNote(id: string): Promise<boolean> {
    if (id === selectedId) return false;
    await flushPendingSave();
    const note = notes.find((n) => n.id === id)!;
    setSelectedId(id);
    setTitle(note.title);
    setBody(note.body ?? "");
    return true;
  }

  function handleTitleChange(value: string) {
    setTitle(value);
    if (selectedId) scheduleSave(selectedId, value, body);
  }

  function handleBodyChange(value: string) {
    setBody(value);
    if (selectedId) scheduleSave(selectedId, title, value);
  }

  async function handleNewNote(): Promise<boolean> {
    try {
      await flushPendingSave();
      const note = await createNote(supabase, "Untitled", "");
      setNotes((prev) => [note, ...prev]);
      setSelectedId(note.id);
      setTitle(note.title);
      setBody("");
      return true;
    } catch {
      onError("Failed to create note.");
      return false;
    }
  }

  async function handleDelete(): Promise<boolean> {
    if (!selectedId) return false;
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
      const next = remaining[0] ?? null;
      setSelectedId(next?.id ?? null);
      setTitle(next?.title ?? "");
      setBody(next?.body ?? "");
      return true;
    } catch {
      onError("Failed to delete note.");
      return false;
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
      onError("Failed to assign collection.");
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
      onError("Failed to move note.");
    }
  }

  async function handleRefresh() {
    try {
      const fresh = await getNotes(supabase);
      setNotes(fresh);
    } catch {
      onError("Failed to load notes.");
    }
  }

  return {
    notes,
    selectedId,
    selectedNote,
    title,
    body,
    saving,
    contextMenu,
    setContextMenu,
    handleSelectNote,
    handleTitleChange,
    handleBodyChange,
    handleNewNote,
    handleDelete,
    handleAssignCollection,
    handleNoteContextMenu,
    handleMoveNote,
    handleRefresh,
  };
}
