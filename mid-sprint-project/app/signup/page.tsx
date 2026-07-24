import { signUpAction } from "@/app/auth/actions";

export default function SignUpPage() {
  return (
    <main className="mx-auto w-[26rem] p-8">
      <h1 className="text-xl font-semibold mb-1">Sign up</h1>
      <p className="text-sm text-[var(--muted-foreground)] mb-4">
        Create an account to start saving bookmarks.
      </p>
      <div className="rounded-xl border border-[var(--border)] shadow-sm p-[34px]">
        <form action={signUpAction} className="flex flex-col gap-3">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required className="border rounded p-2 w-full" />
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required minLength={6} className="border rounded p-2 w-full" />
          <button type="submit" className="border rounded p-2">Sign up</button>
        </form>
      </div>
      <a href="/login" className="block mt-4 underline">Already have an account? Log in</a>
    </main>
  );
}
