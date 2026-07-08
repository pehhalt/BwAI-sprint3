import { useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { searchNotes, type Note } from "@/app/lib/db";

export function useSearch(supabase: SupabaseClient, onError: (msg: string) => void) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Note[] | null>(null);
  const [searching, setSearching] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        onError("Search failed.");
        setSearchResults(null);
      } finally {
        setSearching(false);
      }
    }, 300);
  }

  return { searchQuery, searchResults, searching, handleSearchChange };
}
