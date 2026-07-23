import { signUpAction } from "@/app/auth/actions";

export default function SignUpPage() {
  return (
    <main className="mx-auto max-w-sm p-8">
      <h1 className="text-xl font-semibold mb-4">Sign up</h1>
      <form action={signUpAction} className="flex flex-col gap-3">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required className="border rounded p-2" />
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required minLength={6} className="border rounded p-2" />
        <button type="submit" className="border rounded p-2">Sign up</button>
      </form>
      <a href="/login" className="block mt-4 underline">Already have an account? Log in</a>
    </main>
  );
}
