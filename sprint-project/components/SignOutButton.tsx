"use client";

import { signOut } from "@/app/auth/actions";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button type="submit" className="text-sm text-gray-600 underline">
        Sign out
      </button>
    </form>
  );
}
