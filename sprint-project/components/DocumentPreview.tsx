"use client";

import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";
import type { Project, RewriteVersion, Section } from "@/lib/types";

export function DocumentPreview({
  project,
  sections,
}: {
  project: Project;
  sections: { section: Section; version: RewriteVersion }[];
}) {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="no-print mb-6">
        <div className="mb-2 flex items-center justify-between">
          <Link
            href={`/projects/${project.id}`}
            className="text-sm text-gray-600 underline"
          >
            ← {project.title}
          </Link>
          <SignOutButton />
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{project.title} — preview</h1>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded bg-gray-800 px-3 py-1.5 text-sm text-white"
          >
            Print / Save as PDF
          </button>
        </div>
      </div>

      {sections.length === 0 ? (
        <p className="text-sm text-gray-500">No approved sections yet.</p>
      ) : (
        <article className="prose max-w-none">
          <h1 className="mb-12">{project.title}</h1>
          {sections.map(({ section, version }) => (
            <section key={section.id} className="mb-12">
              <h2>{section.title}</h2>
              <div className="whitespace-pre-wrap">{version.rewritten_text}</div>
            </section>
          ))}
        </article>
      )}
    </main>
  );
}
