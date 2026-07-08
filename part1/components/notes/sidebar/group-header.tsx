import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";

export function GroupHeader({
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
