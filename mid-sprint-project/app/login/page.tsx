import { logInAction } from "@/app/auth/actions";

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-sm p-8">
      <h1 className="text-xl font-semibold mb-4">Log in</h1>
      <form action={logInAction} className="flex flex-col gap-3">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required className="border rounded p-2" />
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required className="border rounded p-2" />
        <button type="submit" className="border rounded p-2">Log in</button>
      </form>
      <a href="/signup" className="block mt-4 underline">Need an account? Sign up</a>
    </main>
  );
}
