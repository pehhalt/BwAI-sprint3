"use client";

import { useState, useTransition } from "react";
import { approveVersion } from "@/app/actions/versions";

export function ApprovalButton({
  projectId,
  sectionId,
  versionId,
}: {
  projectId: string;
  sectionId: string;
  versionId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await approveVersion(projectId, sectionId, versionId);
            setError(result?.error);
          })
        }
        className="rounded bg-green-600 px-3 py-1 text-xs text-white disabled:opacity-50"
      >
        {pending ? "Approving…" : "Approve"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
