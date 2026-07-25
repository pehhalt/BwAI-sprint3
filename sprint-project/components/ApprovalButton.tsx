"use client";

import { useTransition } from "react";
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

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await approveVersion(projectId, sectionId, versionId);
        })
      }
      className="rounded bg-green-600 px-3 py-1 text-xs text-white disabled:opacity-50"
    >
      {pending ? "Approving…" : "Approve"}
    </button>
  );
}
