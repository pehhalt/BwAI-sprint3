import Link from "next/link";
import { SignUpForm } from "@/components/SignUpForm";

export default function SignUpPage() {
  return (
    <main className="mx-auto w-[30rem] p-8">
      <h1 className="mb-1 text-xl font-semibold">Create an account</h1>
      <p className="mb-4 text-sm text-gray-600">
        Create an account to start rewriting your course scripts.
      </p>
      <div className="rounded-xl border border-gray-400 p-[34px] shadow-sm">
        <SignUpForm />
      </div>
      <Link href="/login" className="mt-4 block text-sm underline">
        Already have an account? Sign in
      </Link>
    </main>
  );
}
