"use client";

import { useActionState } from "react";
import { signUp } from "@/app/auth/actions";

type State = { error?: string; message?: string };
const initialState: State = {};

export function SignUpForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: State, formData: FormData): Promise<State> => {
      const result = await signUp(formData);
      if (result?.error) return { error: result.error };
      if (result?.message) return { message: result.message };
      return {};
    },
    initialState
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label htmlFor="signup-email" className="text-sm text-gray-600">
        New account email
      </label>
      <input
        id="signup-email"
        name="email"
        type="email"
        required
        className="rounded border border-gray-300 p-2 text-sm"
      />

      <label htmlFor="signup-password" className="text-sm text-gray-600">
        New account password
      </label>
      <input
        id="signup-password"
        name="password"
        type="password"
        required
        minLength={6}
        className="rounded border border-gray-300 p-2 text-sm"
      />

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-gray-800 px-3 py-1.5 text-sm text-white disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create account"}
      </button>
      {state.error && <span className="text-sm text-red-600">{state.error}</span>}
      {state.message && <span className="text-sm text-green-600">{state.message}</span>}
    </form>
  );
}
