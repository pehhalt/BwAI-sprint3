import { useRef, useState } from "react";
import { searchNotesAction } from "@/app/actions/notes";
import type { Note } from "@/app/lib/db";

export function useSearch(onError: (msg: string) => void) {
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
        const results = await searchNotesAction(query.trim());
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
