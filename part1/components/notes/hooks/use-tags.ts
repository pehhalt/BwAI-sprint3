import { useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createTag,
  findTagByName,
  addTagToNote,
  removeTagFromNote,
  isUniqueViolation,
  type Tag,
} from "@/app/lib/db";

export function useTags(
  supabase: SupabaseClient,
  initialTags: Tag[],
  initialNoteTags: Record<string, Tag[]>,
  selectedId: string | null,
  onError: (msg: string) => void
) {
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [noteTags, setNoteTags] = useState<Record<string, Tag[]>>(initialNoteTags);
  const [activeTagIds, setActiveTagIds] = useState<Set<string>>(new Set());
  const [tagInput, setTagInput] = useState("");
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);

  const selectedNoteTags = selectedId ? (noteTags[selectedId] ?? []) : [];

  const tagSuggestions = tags.filter(
    (t) =>
      !selectedNoteTags.some((st) => st.id === t.id) &&
      t.name.toLowerCase().includes(tagInput.toLowerCase()) &&
      tagInput.trim().length > 0
  );

  function toggleTagFilter(tagId: string) {
    setActiveTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      return next;
    });
  }

  function clearTagFilter() {
    setActiveTagIds(new Set());
  }

  function clearNoteTags(noteId: string) {
    setNoteTags((prev) => {
      const next = { ...prev };
      delete next[noteId];
      return next;
    });
  }

  async function handleAddTag(tagName: string) {
    if (!selectedId || !tagName.trim()) return;
    const name = tagName.trim();

    if (selectedNoteTags.some((t) => t.name.toLowerCase() === name.toLowerCase()))
      return;

    try {
      let tag = tags.find((t) => t.name.toLowerCase() === name.toLowerCase());
      if (!tag) {
        try {
          tag = await createTag(supabase, name);
        } catch (e) {
          // Another request created the same tag first (unique_violation on
          // tags.name) — look it up and use it instead of failing.
          if (!isUniqueViolation(e)) throw e;
          const existing = await findTagByName(supabase, name);
          if (!existing) throw e;
          tag = existing;
        }
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
      onError("Failed to add tag.");
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
      onError("Failed to remove tag.");
    }
  }

  return {
    tags,
    noteTags,
    activeTagIds,
    tagInput,
    setTagInput,
    tagDropdownOpen,
    setTagDropdownOpen,
    selectedNoteTags,
    tagSuggestions,
    toggleTagFilter,
    clearTagFilter,
    clearNoteTags,
    handleAddTag,
    handleRemoveTag,
  };
}
