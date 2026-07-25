"use client";

import { useActionState } from "react";
import { createProject } from "@/app/actions/projects";

type State = { error?: string };
const initialState: State = {};

export function ProjectForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: State, formData: FormData): Promise<State> => {
      const result = await createProject(formData);
      return result?.error ? { error: result.error } : {};
    },
    initialState
  );

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-3">
      <label htmlFor="title" className="text-sm text-gray-600">
        Title
      </label>
      <input
        id="title"
        name="title"
        required
        className="rounded border border-gray-300 p-2 text-sm"
      />

      <label htmlFor="target_audience" className="text-sm text-gray-600">
        Target audience
      </label>
      <textarea
        id="target_audience"
        name="target_audience"
        rows={2}
        className="rounded border border-gray-300 p-2 text-sm"
      />

      <label htmlFor="global_instructions" className="text-sm text-gray-600">
        Project-wide rewriting rules
      </label>
      <textarea
        id="global_instructions"
        name="global_instructions"
        rows={4}
        className="rounded border border-gray-300 p-2 text-sm"
      />

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-blue-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create project"}
      </button>
      {state.error && <span className="text-sm text-red-600">{state.error}</span>}
    </form>
  );
}
