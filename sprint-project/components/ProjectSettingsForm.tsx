"use client";

import { useActionState } from "react";
import { updateProjectSettings } from "@/app/actions/projects";
import type { Project } from "@/lib/types";

type State = { error?: string; success?: boolean };
const initialState: State = {};

export function ProjectSettingsForm({
  projectId,
  project,
}: {
  projectId: string;
  project: Project;
}) {
  const [state, formAction, pending] = useActionState(
    async (_prev: State, formData: FormData): Promise<State> => {
      const result = await updateProjectSettings(projectId, formData);
      return result?.error ? { error: result.error } : { success: true };
    },
    initialState
  );

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-lg border border-gray-400 p-4"
    >
      <label htmlFor="title" className="text-sm text-gray-600">
        Title
      </label>
      <input
        id="title"
        name="title"
        defaultValue={project.title}
        required
        className="rounded border border-gray-300 p-2 text-sm"
      />

      <label htmlFor="target_audience" className="text-sm text-gray-600">
        Target audience
      </label>
      <textarea
        id="target_audience"
        name="target_audience"
        defaultValue={project.target_audience}
        rows={2}
        className="rounded border border-gray-300 p-2 text-sm"
      />

      <label htmlFor="global_instructions" className="text-sm text-gray-600">
        Project-wide rewriting rules
      </label>
      <textarea
        id="global_instructions"
        name="global_instructions"
        defaultValue={project.global_instructions}
        rows={4}
        className="rounded border border-gray-300 p-2 text-sm"
      />

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="self-start rounded bg-blue-800 px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save settings"}
        </button>
        {state.success && <span className="text-sm text-green-600">Saved.</span>}
        {state.error && <span className="text-sm text-red-600">{state.error}</span>}
      </div>
    </form>
  );
}
