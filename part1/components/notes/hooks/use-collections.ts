import { useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createCollection, renameCollection, type Collection } from "@/app/lib/db";

export function useCollections(
  supabase: SupabaseClient,
  initialCollections: Collection[],
  onError: (msg: string) => void
) {
  const [collections, setCollections] = useState<Collection[]>(initialCollections);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [uncollectedExpanded, setUncollectedExpanded] = useState(true);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [showNewCollectionInput, setShowNewCollectionInput] = useState(false);
  const [renamingCollectionId, setRenamingCollectionId] = useState<string | null>(null);

  function toggleCollection(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleUncollectedExpanded() {
    setUncollectedExpanded((v) => !v);
  }

  function startRenameCollection(id: string) {
    setRenamingCollectionId(id);
  }

  function cancelRenameCollection() {
    setRenamingCollectionId(null);
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
      onError("Failed to rename collection.");
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
      onError("Failed to create collection.");
    }
  }

  return {
    collections,
    expandedIds,
    uncollectedExpanded,
    toggleCollection,
    toggleUncollectedExpanded,
    newCollectionName,
    setNewCollectionName,
    showNewCollectionInput,
    setShowNewCollectionInput,
    renamingCollectionId,
    startRenameCollection,
    cancelRenameCollection,
    handleRenameCollection,
    handleNewCollection,
  };
}
