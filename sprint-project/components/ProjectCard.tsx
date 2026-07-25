import Link from "next/link";
import type { Project } from "@/lib/types";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="block rounded-lg border border-gray-200 p-4 hover:border-gray-400"
    >
      <h2 className="font-medium">{project.title}</h2>
      {project.target_audience && (
        <p className="mt-1 line-clamp-2 text-sm text-gray-500">
          {project.target_audience}
        </p>
      )}
    </Link>
  );
}
