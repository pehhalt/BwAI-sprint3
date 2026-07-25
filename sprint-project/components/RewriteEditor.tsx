"use client";

import { useActionState } from "react";
import { generateRewrite } from "@/app/actions/rewrite";
import { ModelBadge } from "@/components/ModelBadge";
import type { RewriteVersion } from "@/lib/types";

type State = { error?: string; success?: boolean };
const initialState: State = {};

export function RewriteEditor({
  sectionId,
  latestVersion,
}: {
  sectionId: string;
  latestVersion: RewriteVersion | null;
}) {
  const [generateState, generateAction, generatePending] = useActionState(
    async (_prev: State, formData: FormData): Promise<State> => {
      const result = await generateRewrite(formData);
      return result ?? { success: true };
    },
    initialState
  );

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-gray-200 p-4">
      <h2 className="font-medium">AI rewrite</h2>

      <form action={generateAction} className="flex flex-col gap-2">
        <input type="hidden" name="section_id" value={sectionId} />
        <label className="text-sm text-gray-600">
          Section-specific instructions (optional)
        </label>
        <textarea
          name="section_instructions"
          rows={3}
          className="w-full rounded border border-gray-300 p-2 text-sm"
        />
        <button
          type="submit"
          disabled={generatePending}
          className="self-start rounded bg-blue-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          {generatePending ? "Generating…" : "Generate rewrite"}
        </button>
        {generateState.error && (
          <span className="text-sm text-red-600">{generateState.error}</span>
        )}
      </form>

      {latestVersion ? (
        <div className="flex flex-col gap-2 border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Latest version (read-only for now — editing lands in Task 14)
            </span>
            <ModelBadge model={latestVersion.model} />
          </div>
          <pre className="whitespace-pre-wrap rounded border border-gray-200 bg-gray-50 p-2 text-sm">
            {latestVersion.rewritten_text}
          </pre>
        </div>
      ) : (
        <p className="text-sm text-gray-500">No rewrite generated yet.</p>
      )}
    </div>
  );
}
