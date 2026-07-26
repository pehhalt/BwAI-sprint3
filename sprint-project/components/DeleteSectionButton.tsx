"use client";

import { useState, useTransition } from "react";
import { deleteSection } from "@/app/actions/sections";

export function DeleteSectionButton({
  projectId,
  sectionId,
  sectionTitle,
}: {
  projectId: string;
  sectionId: string;
  sectionTitle: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={pending}
        aria-label={`Delete ${sectionTitle}`}
        onClick={() => {
          if (
            !window.confirm(
              `Delete "${sectionTitle}"? This also deletes its rewrite versions.`
            )
          ) {
            return;
          }
          startTransition(async () => {
            const result = await deleteSection(projectId, sectionId);
            setError(result?.error);
          });
        }}
        className="rounded bg-red-600 px-3 py-1 text-xs text-white disabled:opacity-50"
      >
        {pending ? "Deleting…" : "Delete"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
