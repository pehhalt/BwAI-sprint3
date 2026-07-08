import { XIcon } from "lucide-react";
import type { Tag } from "@/app/lib/db";

export function TagPill({
  tag,
  onRemove,
  compact = false,
}: {
  tag: Tag;
  onRemove?: () => void;
  compact?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary font-medium ${
        compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs"
      }`}
    >
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
