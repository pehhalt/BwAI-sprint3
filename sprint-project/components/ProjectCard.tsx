"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { deleteProject } from "@/app/actions/projects";
import type { Project } from "@/lib/types";

export function ProjectCard({ project }: { project: Project }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  return (
    <div className="rounded-lg border border-gray-200 p-4 hover:border-gray-400">
      <Link href={`/projects/${project.id}`} className="block">
        <h2 className="font-medium">{project.title}</h2>
        {project.target_audience && (
          <p className="mt-1 line-clamp-2 text-sm text-gray-500">
            {project.target_audience}
          </p>
        )}
      </Link>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          disabled={pending}
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
    </div>
  );
}
