"use client";

import { useActionState } from "react";
import { createSection } from "@/app/actions/sections";

type State = { error?: string };
const initialState: State = {};

export function SectionForm({ projectId }: { projectId: string }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: State, formData: FormData): Promise<State> => {
      const result = await createSection(formData);
      return result?.error ? { error: result.error } : {};
    },
    initialState
  );

  return (
    <form
      action={formAction}
      className="flex flex-col gap-2 rounded-lg border border-gray-400 p-4"
    >
      <h2 className="font-medium">New section</h2>
      <input type="hidden" name="project_id" value={projectId} />
      <label htmlFor="title" className="text-sm text-gray-600">
        Section title
      </label>
      <input
        id="title"
        name="title"
        className="w-full rounded border border-gray-300 p-2 text-sm"
      />
      <label htmlFor="source_text" className="text-sm text-gray-600">
        Source text
      </label>
      <textarea
        id="source_text"
        name="source_text"
        rows={30}
        className="w-full rounded border border-gray-300 p-2 font-mono text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-gray-800 px-3 py-1.5 text-sm text-white disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add section"}
      </button>
      {state.error && <span className="text-sm text-red-600">{state.error}</span>}
    </form>
  );
}
