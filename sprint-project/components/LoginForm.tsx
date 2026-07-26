"use client";

import { useActionState } from "react";
import { signIn } from "@/app/auth/actions";

type State = { error?: string };
const initialState: State = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: State, formData: FormData): Promise<State> => {
      const result = await signIn(formData);
      return result?.error ? { error: result.error } : {};
    },
    initialState
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label htmlFor="email" className="text-sm text-gray-600">
        Email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        className="rounded border border-gray-300 p-2 text-sm"
      />

      <label htmlFor="password" className="text-sm text-gray-600">
        Password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        required
        className="rounded border border-gray-300 p-2 text-sm"
      />

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-blue-800 px-3 py-1.5 text-sm text-white disabled:opacity-50"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
      {state.error && <span className="text-sm text-red-600">{state.error}</span>}
    </form>
  );
}
