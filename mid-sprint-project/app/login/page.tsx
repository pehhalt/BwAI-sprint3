import { logInAction } from "@/app/auth/actions";

export default function LoginPage() {
  return (
    <main className="mx-auto w-[26rem] p-8">
      <h1 className="text-xl font-semibold mb-1">Log in</h1>
      <p className="text-sm text-[var(--muted-foreground)] mb-4">
        Sign in to view and manage your saved bookmarks.
      </p>
      <div className="rounded-xl border border-[var(--border)] shadow-sm p-[34px]">
        <form action={logInAction} className="flex flex-col gap-3">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required className="border rounded p-2 w-full" />
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required className="border rounded p-2 w-full" />
          <button type="submit" className="border rounded p-2">Log in</button>
        </form>
      </div>
      <a href="/signup" className="block mt-4 underline">Need an account? Sign up</a>
    </main>
  );
}
