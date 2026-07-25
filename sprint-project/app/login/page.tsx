import { LoginForm } from "@/components/LoginForm";
import { SignUpForm } from "@/components/SignUpForm";

export default function LoginPage() {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-10 p-6 pt-16">
      <div>
        <h1 className="mb-4 text-xl font-semibold">Sign in</h1>
        <LoginForm />
      </div>
      <div className="border-t border-gray-200 pt-8">
        <h2 className="mb-4 text-lg font-medium">Create an account</h2>
        <SignUpForm />
      </div>
    </main>
  );
}
