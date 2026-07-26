"use client";

import { useActionState } from "react";
import { updateSectionText } from "@/app/actions/sections";
import type { Section } from "@/lib/types";

type State = { error?: string; success?: boolean };
const initialState: State = {};

export function SourceEditor({
  projectId,
  section,
}: {
  projectId: string;
  section: Section;
}) {
  const [state, formAction, pending] = useActionState(
    async (_prev: State, formData: FormData): Promise<State> => {
      const text = String(formData.get("source_text") ?? "");
      const result = await updateSectionText(projectId, section.id, text);
      return result ?? { success: true };
    },
    initialState
  );

  return (
    <form
      action={formAction}
      className="flex flex-col gap-2 rounded-lg border border-gray-400 p-4"
    >
      <h2 className="font-medium">Source text</h2>
      <textarea
        name="source_text"
        defaultValue={section.source_text}
        rows={30}
        className="w-full rounded border border-gray-300 p-2 font-mono text-sm"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-gray-800 px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save source text"}
        </button>
        {state.success && <span className="text-sm text-green-600">Saved.</span>}
        {state.error && <span className="text-sm text-red-600">{state.error}</span>}
      </div>
    </form>
  );
}
