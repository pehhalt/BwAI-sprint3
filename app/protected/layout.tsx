import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { LogoutButton } from "@/components/logout-button";

async function UserInfo() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return (
    <div className="flex items-center gap-4">
      Hey, {user.email}!
      <LogoutButton />
    </div>
  );
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-muted/40 p-6">
      <div
        className="w-full max-w-[1050px] flex flex-col rounded-lg border bg-background shadow-sm overflow-hidden"
        style={{ height: "calc(100vh - 3rem)" }}
      >
        <nav className="h-14 border-b px-5 flex items-center justify-between shrink-0">
          <span className="font-semibold text-sm">Notes</span>
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <Suspense fallback={<div className="h-8 w-36 rounded bg-muted animate-pulse" />}>
              <UserInfo />
            </Suspense>
          </div>
        </nav>

        <div className="flex-1 flex overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
