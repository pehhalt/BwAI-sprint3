import { TagIcon } from "lucide-react";
import type { Tag } from "@/app/lib/db";
import { TagPill } from "@/components/notes/editor/tag-pill";

export function TagEditor({
  selectedNoteTags,
  tagInput,
  onTagInputChange,
  tagDropdownOpen,
  onTagDropdownOpenChange,
  tagSuggestions,
  onAddTag,
  onRemoveTag,
}: {
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
    <div className="border-t pt-4 flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <TagIcon size={13} className="text-muted-foreground" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Tags
        </span>
      </div>

      {selectedNoteTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedNoteTags.map((tag) => (
            <TagPill key={tag.id} tag={tag} onRemove={() => onRemoveTag(tag.id)} />
          ))}
        </div>
      )}

      <div className="relative">
        <input
          value={tagInput}
          onChange={(e) => {
            onTagInputChange(e.target.value);
            onTagDropdownOpenChange(e.target.value.trim().length > 0);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAddTag(tagInput);
            }
            if (e.key === "Escape") {
              onTagInputChange("");
              onTagDropdownOpenChange(false);
            }
          }}
          onFocus={() => {
            if (tagInput.trim()) onTagDropdownOpenChange(true);
          }}
          onBlur={() => setTimeout(() => onTagDropdownOpenChange(false), 150)}
          placeholder="Add a tag…"
          className="w-full max-w-56 text-xs border rounded px-2 py-1 bg-background outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
        />

        {tagDropdownOpen && (
          <div className="absolute top-full left-0 mt-1 w-56 border rounded bg-background shadow-md z-10 overflow-hidden">
            {tagSuggestions.length > 0 ? (
              tagSuggestions.map((tag) => (
                <button
                  key={tag.id}
                  onMouseDown={() => onAddTag(tag.name)}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent transition-colors"
                >
                  {tag.name}
                </button>
              ))
            ) : (
              <button
                onMouseDown={() => onAddTag(tagInput)}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent transition-colors text-muted-foreground"
              >
                Create &ldquo;{tagInput.trim()}&rdquo;
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
