import { Loader2 } from "lucide-react";

export default function NotesSkeleton() {
  return (
    <div className="relative flex h-full w-full overflow-hidden animate-pulse">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-12 px-4 border-b flex items-center justify-between shrink-0">
          <div className="h-3.5 w-10 rounded bg-muted" />
          <div className="h-6 w-6 rounded bg-muted" />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search */}
          <div className="px-3 py-2 border-b">
            <div className="h-7 rounded bg-muted" />
          </div>

          {/* Tag filter */}
          <div className="px-3 pt-3 pb-2 border-b flex flex-col gap-2">
            <div className="h-3 w-20 rounded bg-muted" />
            <div className="flex gap-1.5">
              <div className="h-5 w-12 rounded-full bg-muted" />
              <div className="h-5 w-16 rounded-full bg-muted" />
              <div className="h-5 w-10 rounded-full bg-muted" />
            </div>
          </div>

          {/* Note groups */}
          <div className="flex-1 py-1">
            {/* Group header */}
            <div className="px-3 py-2 flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded bg-muted" />
              <div className="h-2.5 w-20 rounded bg-muted" />
            </div>
            {/* Note cards */}
            {[0, 1, 2].map((i) => (
              <div key={i} className="px-4 py-3 border-b flex flex-col gap-1.5">
                <div className="h-3.5 w-3/4 rounded bg-muted" />
                <div className="h-2.5 w-full rounded bg-muted" />
                <div className="h-2.5 w-1/3 rounded bg-muted" />
              </div>
            ))}

            {/* Second group header */}
            <div className="px-3 py-2 flex items-center gap-2 mt-1">
              <div className="h-2.5 w-2.5 rounded bg-muted" />
              <div className="h-2.5 w-24 rounded bg-muted" />
            </div>
            {[0, 1].map((i) => (
              <div key={i} className="px-4 py-3 border-b flex flex-col gap-1.5">
                <div className="h-3.5 w-2/3 rounded bg-muted" />
                <div className="h-2.5 w-full rounded bg-muted" />
                <div className="h-2.5 w-1/4 rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Editor */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="h-12 px-6 border-b flex items-center gap-4 shrink-0">
          <div className="h-3 w-10 rounded bg-muted" />
          <div className="h-7 w-40 rounded bg-muted" />
          <div className="ml-auto flex items-center gap-3">
            <div className="h-3 w-12 rounded bg-muted" />
            <div className="h-6 w-6 rounded bg-muted" />
          </div>
        </div>

        {/* Editor body */}
        <div className="flex-1 p-8 flex flex-col gap-4">
          <div className="h-8 w-2/3 rounded bg-muted" />
          <div className="flex flex-col gap-2.5 mt-2">
            <div className="h-3 w-full rounded bg-muted" />
            <div className="h-3 w-5/6 rounded bg-muted" />
            <div className="h-3 w-full rounded bg-muted" />
            <div className="h-3 w-4/6 rounded bg-muted" />
          </div>
        </div>
      </main>
      {/* Spinner centred over the full skeleton, shifted up 250px from centre */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <Loader2 className="h-[72px] w-[72px] animate-spin text-red-500 -mt-[250px]" />
      </div>
    </div>
  );
}
