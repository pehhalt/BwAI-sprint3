import { useEffect } from "react";
import type { Collection } from "@/app/lib/db";

export function ContextMenu({
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
