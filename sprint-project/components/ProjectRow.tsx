"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { deleteProject } from "@/app/actions/projects";
import type { Project } from "@/lib/types";

export function ProjectRow({
  project,
  index,
}: {
  project: Project;
  index: number;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  return (
    <tr
      className={`[&:last-child>td]:border-b-0 ${index % 2 === 0 ? "bg-white" : "bg-gray-100"}`}
    >
      <td className="w-full border-b border-gray-200 px-4 py-2">
        <Link href={`/projects/${project.id}`} className="font-medium">
          {project.title}
        </Link>
      </td>
      <td className="border-b border-gray-200 px-4 py-2 text-sm text-gray-500">
        {project.target_audience && (
          <span className="line-clamp-2">{project.target_audience}</span>
        )}
      </td>
      <td className="whitespace-nowrap border-b border-gray-200 px-4 py-2 text-right">
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={pending}
            aria-label={`Delete ${project.title}`}
            onClick={() => {
              if (
                !window.confirm(
                  `Delete "${project.title}"? This also deletes all its sections and rewrites.`
                )
              ) {
                return;
              }
              startTransition(async () => {
                const result = await deleteProject(project.id);
                setError(result?.error);
              });
            }}
            className="rounded bg-red-600 px-3 py-1 text-xs text-white disabled:opacity-50"
          >
            {pending ? "Deleting…" : "Delete"}
          </button>
          {error && <span className="text-xs text-red-600">{error}</span>}
        </div>
      </td>
    </tr>
  );
}
