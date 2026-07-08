import { useState, useRef, useEffect } from "react";
import { ChevronDownIcon, ChevronRightIcon, PencilIcon } from "lucide-react";
import type { Collection } from "@/app/lib/db";

export function CollectionHeader({
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
