# Bookmarks App (Mid-Sprint Project) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a minimal, provably secure multi-user bookmarks manager (save, list, delete — no tags, no edit) that satisfies every requirement of the course's "Ship a Secured App and Prove It" mid-sprint project.

**Architecture:** Next.js 16 (App Router) + TypeScript + Tailwind CSS, mirroring `part1/`'s stack. Supabase (its own, separate project — not `part1/`'s) provides email/password auth and a single RLS-locked `bookmarks` table. All Supabase access goes through Server Actions and `app/lib/db.ts` — never a client component calling Supabase directly — because `part1/`'s own history (see `part1/docs/superpowers/specs/2026-07-22-server-actions-migration-design.md`) already proved client-side "ownership checks" are bypassable and add nothing beyond RLS. Deployed to Vercel with only the publishable (anon) key as an env var. Playwright (Chromium only) covers one happy-path test per feature slice.

**Tech Stack:** Next.js (App Router), TypeScript, Tailwind CSS, `@supabase/ssr` + `@supabase/supabase-js`, Supabase CLI (migrations), Vercel, Playwright.

## Global Constraints

- Multi-user: independent sign-up, each user sees only their own rows.
- Supabase Auth (email/password) for sign-up/log-in/log-out. A signed-out visitor must be blocked from every protected route, including by typing the URL directly — enforced server-side (middleware + a server-side `getUser()` check on the page itself), never a client-side-only check.
- The single `bookmarks` table has RLS enabled and an owner-scoped policy per operation, pinned to the `authenticated` role (matches this repo's own prior fix: `6c48438 Pin RLS policies to authenticated, drop untracked policy drift`).
- All schema changes are Supabase CLI migration files under `mid-sprint-project/supabase/migrations/` — no ad-hoc dashboard edits.
- Deployed to Vercel. Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (the anon/publishable key) are set as env vars, matching `part1/`'s naming convention. The service role key is never generated into any file this project writes, never added to Vercel, and never assigned to a `NEXT_PUBLIC_` var.
- `mid-sprint-project/.env.local` is git-ignored and never committed.
- Scope is fixed at: save a bookmark (URL + manual title), list your bookmarks, delete a bookmark. No tags, no edit, no server-side title auto-fetch (ai-architect flagged auto-fetch as an SSRF / unauthenticated-fetch-route trap).
- One Playwright happy-path test is added per feature slice, as it's built — not saved for the end.
- `ai-architect` was already consulted before this plan was written (see conversation history) — this requirement is satisfied, not a task below.
- Final full `/security-scan` after build + deploy; fix every critical/high finding; then a **separate, genuinely fresh Claude Code session** re-runs `/security-scan` to confirm zero criticals/highs. The rescan must not happen in the same session as the fixes.

---

## Task 1: Scaffold the Next.js app

**Files:**
- Create: `mid-sprint-project/` (via `create-next-app`)
- Create: `mid-sprint-project/CLAUDE.md`
- Modify: `mid-sprint-project/.gitignore` (created by `create-next-app`; confirm `.env*.local` is present)

**Interfaces:**
- Produces: a running Next.js App Router project at `mid-sprint-project/` that later tasks add files into.

- [x] **Step 1: Scaffold the project**

Run from the repo root:

```bash
npx create-next-app@latest mid-sprint-project --typescript --tailwind --app --eslint --src-dir=false --import-alias "@/*" --use-npm
```

Accept defaults for any remaining prompt.

- [x] **Step 2: Verify `.gitignore` covers local secrets**

Open `mid-sprint-project/.gitignore` and confirm it contains an entry matching `.env*.local` (this is the default `create-next-app` template — if missing, add it).

- [x] **Step 3: Write the project's CLAUDE.md**

Create `mid-sprint-project/CLAUDE.md`:

```markdown
# CLAUDE.md — Bookmarks App (Mid-Sprint Project)

A minimal, provably secure multi-user bookmarks manager. Next.js (App
Router) + TypeScript + Tailwind + Supabase.

## Non-Negotiable Rules

1. **All database reads and writes go through `app/lib/db.ts`.** No
   component, page, or route handler may call `supabase` directly.
2. **All writes happen via Next.js Server Actions**, never a client
   component calling Supabase directly. Client-side "ownership checks"
   are bypassable and add nothing beyond RLS — server-side + RLS is the
   only real protection.
3. Every signed-in-only route verifies the session server-side
   (`supabase.auth.getUser()`) before rendering — never rely on the
   client-side session alone.
4. RLS is enabled on every table, with a policy per operation pinned to
   the `authenticated` role.
5. Schema changes are Supabase CLI migrations under `supabase/migrations/`
   only — never a manual dashboard edit with no matching migration file.
6. Scope is fixed: save (URL + manual title), list, delete. No tags, no
   edit, no server-side title auto-fetch.

## Testing

Use the CLI for one-off tasks. Use MCP when the agent needs to repeat or
react to what's on screen.

- `npx playwright test` (CLI) — run the e2e suite before and after every change.
- Playwright MCP — live browser control, for exploring behaviour that
  doesn't have a test yet or confirming a freshly built feature actually
  renders/works.

## Git Workflow

- `main` — stable.
- This is a small, single-contributor mid-sprint project; direct commits
  to `main` are fine (no PR-per-task requirement, unlike `part1/`'s
  optional tasks).
```

- [x] **Step 4: Verify the dev server boots**

```bash
cd mid-sprint-project && npm run dev
```

Expected: server starts on `http://localhost:3000`, default Next.js page loads with no console errors. Stop the server (Ctrl+C) once confirmed.

- [x] **Step 5: Commit**

```bash
git add mid-sprint-project/
git commit -m "Scaffold bookmarks app (Next.js, TypeScript, Tailwind)"
```

---

## Task 2: Create the Supabase project and wire up the client helpers

**Files:**
- Create: `mid-sprint-project/.env.local` (git-ignored, never committed)
- Create: `mid-sprint-project/.env.example`
- Create: `mid-sprint-project/lib/supabase/client.ts`
- Create: `mid-sprint-project/lib/supabase/server.ts`

**Interfaces:**
- Produces: `createClient()` (browser, `lib/supabase/client.ts`) and `createClient()` (server, async, `lib/supabase/server.ts`) — later tasks import both by these exact names from these exact paths.

- [ ] **Step 1: Create a new, separate Supabase project**

In the Supabase dashboard, create a **new** project (do not reuse `part1/`'s project) — e.g. named `bookmarks-app`. Note the Project URL and the publishable (anon) key from Project Settings > API.

Under Authentication > Providers > Email, turn **off** "Confirm email" for this project. This is a course project, not production — disabling email confirmation lets Playwright sign up a throwaway test user per run without needing to read a real inbox. Note this as an intentional, documented simplification (not something to carry into a real production app).

- [ ] **Step 2: Write `.env.local` and `.env.example`**

`mid-sprint-project/.env.local` (git-ignored — never commit this file):

```
NEXT_PUBLIC_SUPABASE_URL=<your project URL>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your publishable/anon key>
```

`mid-sprint-project/.env.example` (committed — placeholders only):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

- [ ] **Step 2b: Confirm `.env.local` is actually git-ignored**

```bash
git check-ignore -v mid-sprint-project/.env.local
```

Expected: prints the `.gitignore` rule matching it. If it prints nothing, stop and fix `.gitignore` before continuing — do not proceed with an unignored secrets file.

- [ ] **Step 3: Install the Supabase SSR package**

```bash
cd mid-sprint-project && npm install @supabase/ssr @supabase/supabase-js
```

- [ ] **Step 4: Browser client**

Create `mid-sprint-project/lib/supabase/client.ts`:

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
```

- [ ] **Step 5: Server client**

Create `mid-sprint-project/lib/supabase/server.ts`:

```ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component render — middleware (Task 3)
            // refreshes the session instead. Safe to ignore here.
          }
        },
      },
    }
  );
}
```

- [ ] **Step 6: Verify the connection**

Temporarily add this to `mid-sprint-project/app/page.tsx` (will be replaced in Task 3):

```tsx
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getSession();
  return <pre>{JSON.stringify({ hasSession: !!data.session, error }, null, 2)}</pre>;
}
```

Run `npm run dev`, open `http://localhost:3000`. Expected: `{"hasSession": false, "error": null}` — no connection error. Revert this file's contents afterward (Task 3 replaces it properly).

- [ ] **Step 7: Commit**

```bash
git add mid-sprint-project/lib mid-sprint-project/.env.example
git commit -m "Add Supabase client helpers and project config"
```

---

## Task 3: Auth flow — sign-up, log-in, log-out, and route protection

**Files:**
- Create: `mid-sprint-project/app/auth/actions.ts`
- Create: `mid-sprint-project/app/signup/page.tsx`
- Create: `mid-sprint-project/app/login/page.tsx`
- Modify: `mid-sprint-project/app/page.tsx`
- Create: `mid-sprint-project/app/bookmarks/page.tsx` (stub — real list/create/delete lands in Task 6)
- Create: `mid-sprint-project/middleware.ts`
- Create: `mid-sprint-project/tests/auth.spec.ts`
- Create: `mid-sprint-project/playwright.config.ts` (via `npm init playwright`)

**Interfaces:**
- Consumes: `createClient()` from `@/lib/supabase/server` (Task 2).
- Produces: `signUpAction`, `logInAction`, `logOutAction` (all `"use server"`, take `FormData`, from `@/app/auth/actions`) — Task 6 imports `logOutAction` for the real bookmarks page header.

- [ ] **Step 1: Write the failing Playwright test first**

Install Playwright (accept Chromium-only, default options):

```bash
cd mid-sprint-project && npm init playwright@latest -- --quiet --browser=chromium --gitignore
```

Confirm `playwright.config.ts` has a `webServer` entry that runs `npm run dev` automatically (this is the default `npm init playwright` behavior — if missing, add it pointing at `http://localhost:3000`).

Create `mid-sprint-project/tests/auth.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

test("sign up reaches bookmarks, log out blocks it, direct URL blocks it too", async ({ page }) => {
  const email = uniqueEmail();
  const password = "Test1234!";

  await page.goto("/signup");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign up" }).click();

  await expect(page).toHaveURL(/\/bookmarks/);
  await expect(page.getByRole("heading", { name: "Your bookmarks" })).toBeVisible();

  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login/);

  await page.goto("/bookmarks");
  await expect(page).toHaveURL(/\/login/);
});
```

- [ ] **Step 2: Run it and confirm it fails for the right reason**

```bash
npx playwright test tests/auth.spec.ts
```

Expected: FAIL — `/signup` doesn't exist yet (404 or missing `Email` label), not a flaky/wrong-reason failure.

- [ ] **Step 3: Write the auth Server Actions**

Create `mid-sprint-project/app/auth/actions.ts`:

```ts
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signUpAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(error.message);
  redirect("/bookmarks");
}

export async function logInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  redirect("/bookmarks");
}

export async function logOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
```

- [ ] **Step 4: Write the sign-up and log-in pages**

Create `mid-sprint-project/app/signup/page.tsx`:

```tsx
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
```

Create `mid-sprint-project/app/login/page.tsx`:

```tsx
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
```

- [ ] **Step 5: Root page redirects based on auth state**

Replace `mid-sprint-project/app/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function RootPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  redirect(user ? "/bookmarks" : "/login");
}
```

- [ ] **Step 6: Stub bookmarks page (gated, server-verified)**

Create `mid-sprint-project/app/bookmarks/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logOutAction } from "@/app/auth/actions";

export default async function BookmarksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto max-w-lg p-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Your bookmarks</h1>
        <form action={logOutAction}>
          <button type="submit" className="underline text-sm">Log out</button>
        </form>
      </div>
      <p className="text-sm text-gray-500">Save/list/delete lands in Task 6.</p>
    </main>
  );
}
```

- [ ] **Step 7: Middleware — server-side route protection**

Create `mid-sprint-project/middleware.ts`:

```ts
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (request.nextUrl.pathname.startsWith("/bookmarks") && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/bookmarks/:path*"],
};
```

- [ ] **Step 8: Run the test again and confirm it passes**

```bash
npx playwright test tests/auth.spec.ts
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add mid-sprint-project/app mid-sprint-project/middleware.ts mid-sprint-project/tests mid-sprint-project/playwright.config.ts
git commit -m "Add auth flow (sign-up/log-in/log-out) with server-side route protection"
```

---

## Task 4: First deploy to Vercel

Deploying now, right after the auth slice (before the real bookmarks feature exists), surfaces env-var problems while the app is still simple — per the course's own "deploy early" guidance.

**Files:**
- No new app files. Vercel project linking creates `mid-sprint-project/.vercel/` locally (git-ignored by default).

- [ ] **Step 1: Link and deploy**

```bash
cd mid-sprint-project
vercel link
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY production
vercel --prod
```

When prompted for each env var's value, paste the same values from `.env.local`. Do **not** add a service-role key to any Vercel env var at any scope.

- [ ] **Step 2: Verify as a brand-new incognito visitor**

Open the deployed URL in an incognito window:
- Confirm it redirects to `/login` (no session).
- Sign up as a new user directly on the live URL.
- Confirm it lands on `/bookmarks` and shows the stub page.
- Log out, confirm redirect to `/login`.
- Navigate directly to `<live-url>/bookmarks` while signed out — confirm redirect to `/login`, not the page content.

- [ ] **Step 3: Record the live URL**

Add to `mid-sprint-project/README.md` (create it):

```markdown
# Bookmarks App

Live URL: <paste the Vercel production URL here>

Mid-sprint project: a minimal, provably secure multi-user bookmarks
manager. See `docs/superpowers/plans/2026-07-23-bookmarks-app.md` for the
build plan.
```

- [ ] **Step 4: Commit**

```bash
git add mid-sprint-project/README.md
git commit -m "Add live Vercel URL to README"
```

---

## Task 5: `bookmarks` table migration with RLS

**Files:**
- Create: `mid-sprint-project/supabase/migrations/<timestamp>_create_bookmarks.sql`

**Interfaces:**
- Produces: table `public.bookmarks(id uuid, user_id uuid, url text, title text, created_at timestamptz)` — Task 6's `db.ts` queries this exact shape.

- [ ] **Step 1: Initialize the Supabase CLI project and link it**

```bash
cd mid-sprint-project
npx supabase login
npx supabase init
npx supabase link --project-ref <your-project-ref>
```

(`<your-project-ref>` is in the Supabase dashboard URL for the project created in Task 2.)

- [ ] **Step 2: Create the migration file**

```bash
npx supabase migration new create_bookmarks
```

This creates an empty timestamped file under `supabase/migrations/`. Fill it in:

```sql
create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  url text not null,
  title text not null,
  created_at timestamptz not null default now()
);

alter table public.bookmarks enable row level security;

create policy "bookmarks_select_own" on public.bookmarks
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "bookmarks_insert_own" on public.bookmarks
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "bookmarks_delete_own" on public.bookmarks
  for delete
  to authenticated
  using (auth.uid() = user_id);
```

`user_id` defaults to `auth.uid()`, so the app never sets it explicitly (same pattern as `part1/`'s trigger-based approach, done here via a column default instead since there's only one table). The `with check` on insert still guards against a caller trying to pass a different `user_id` explicitly.

- [ ] **Step 3: Apply the migration**

```bash
npx supabase db push
```

- [ ] **Step 4: Verify in the dashboard**

In the Supabase dashboard, go to Authentication > Policies (or Table Editor > `bookmarks` > RLS). Confirm: RLS is enabled, and three policies exist (`bookmarks_select_own`, `bookmarks_insert_own`, `bookmarks_delete_own`), each scoped to `authenticated` and using `auth.uid() = user_id`.

- [ ] **Step 5: Commit**

```bash
git add mid-sprint-project/supabase
git commit -m "Add bookmarks table migration with owner-scoped RLS"
```

---

## Task 6: Save and list bookmarks

**Files:**
- Create: `mid-sprint-project/app/lib/db.ts`
- Create: `mid-sprint-project/app/bookmarks/actions.ts`
- Modify: `mid-sprint-project/app/bookmarks/page.tsx`
- Create: `mid-sprint-project/tests/create-bookmark.spec.ts`

**Interfaces:**
- Consumes: `createClient()` from `@/lib/supabase/server` (Task 2); `bookmarks` table from Task 5.
- Produces: `type Bookmark = { id: string; url: string; title: string; created_at: string }`, `listBookmarks(): Promise<Bookmark[]>`, `createBookmark(url: string, title: string): Promise<Bookmark>` (both from `@/app/lib/db`) — Task 7 imports `Bookmark` and adds `deleteBookmark` to this same file.

- [ ] **Step 1: Write the failing Playwright test first**

Create `mid-sprint-project/tests/create-bookmark.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

test("create a bookmark and confirm it survives a reload", async ({ page }) => {
  const email = uniqueEmail();
  await page.goto("/signup");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("Test1234!");
  await page.getByRole("button", { name: "Sign up" }).click();
  await expect(page).toHaveURL(/\/bookmarks/);

  await page.getByLabel("Title").fill("Anthropic");
  await page.getByLabel("URL").fill("https://www.anthropic.com");
  await page.getByRole("button", { name: "Save" }).click();

  await expect(page.getByRole("link", { name: "Anthropic" })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("link", { name: "Anthropic" })).toBeVisible();
});
```

- [ ] **Step 2: Run it and confirm it fails for the right reason**

```bash
npx playwright test tests/create-bookmark.spec.ts
```

Expected: FAIL — no `Title`/`URL`/`Save` controls exist on `/bookmarks` yet.

- [ ] **Step 3: Write `app/lib/db.ts`**

Create `mid-sprint-project/app/lib/db.ts`:

```ts
import { createClient } from "@/lib/supabase/server";

export type Bookmark = {
  id: string;
  url: string;
  title: string;
  created_at: string;
};

export async function listBookmarks(): Promise<Bookmark[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookmarks")
    .select("id, url, title, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createBookmark(url: string, title: string): Promise<Bookmark> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookmarks")
    .insert({ url, title })
    .select("id, url, title, created_at")
    .single();
  if (error) throw error;
  return data;
}
```

- [ ] **Step 4: Write the create Server Action**

Create `mid-sprint-project/app/bookmarks/actions.ts`:

```ts
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createBookmark } from "@/app/lib/db";

export async function createBookmarkAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const url = String(formData.get("url") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  if (!url || !title) throw new Error("URL and title are required");

  await createBookmark(url, title);
  revalidatePath("/bookmarks");
}
```

- [ ] **Step 5: Wire the real bookmarks page**

Replace `mid-sprint-project/app/bookmarks/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listBookmarks } from "@/app/lib/db";
import { logOutAction } from "@/app/auth/actions";
import { createBookmarkAction } from "./actions";

export default async function BookmarksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const bookmarks = await listBookmarks();

  return (
    <main className="mx-auto max-w-lg p-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Your bookmarks</h1>
        <form action={logOutAction}>
          <button type="submit" className="underline text-sm">Log out</button>
        </form>
      </div>

      <form action={createBookmarkAction} className="flex gap-2 mb-6">
        <label htmlFor="title" className="sr-only">Title</label>
        <input id="title" name="title" placeholder="Title" required className="border rounded p-2 flex-1" />
        <label htmlFor="url" className="sr-only">URL</label>
        <input id="url" name="url" type="url" placeholder="https://example.com" required className="border rounded p-2 flex-1" />
        <button type="submit" className="border rounded p-2">Save</button>
      </form>

      <ul className="flex flex-col gap-2">
        {bookmarks.map((b) => (
          <li key={b.id} className="border rounded p-2">
            <a href={b.url} className="underline">{b.title}</a>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

- [ ] **Step 6: Run the test again and confirm it passes**

```bash
npx playwright test tests/create-bookmark.spec.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add mid-sprint-project/app/lib mid-sprint-project/app/bookmarks mid-sprint-project/tests/create-bookmark.spec.ts
git commit -m "Add save and list bookmarks"
```

---

## Task 7: Delete a bookmark

**Files:**
- Modify: `mid-sprint-project/app/lib/db.ts`
- Modify: `mid-sprint-project/app/bookmarks/actions.ts`
- Modify: `mid-sprint-project/app/bookmarks/page.tsx`
- Create: `mid-sprint-project/tests/delete-bookmark.spec.ts`

**Interfaces:**
- Consumes: `Bookmark`, `listBookmarks`, `createBookmark` from `@/app/lib/db` (Task 6).
- Produces: `deleteBookmark(id: string): Promise<void>` (from `@/app/lib/db`), `deleteBookmarkAction` (from `@/app/bookmarks/actions`).

- [ ] **Step 1: Write the failing Playwright test first**

Create `mid-sprint-project/tests/delete-bookmark.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

test("delete a bookmark and confirm it's gone after a reload", async ({ page }) => {
  const email = uniqueEmail();
  await page.goto("/signup");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("Test1234!");
  await page.getByRole("button", { name: "Sign up" }).click();
  await expect(page).toHaveURL(/\/bookmarks/);

  await page.getByLabel("Title").fill("Anthropic");
  await page.getByLabel("URL").fill("https://www.anthropic.com");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("link", { name: "Anthropic" })).toBeVisible();

  await page.getByRole("button", { name: "Delete Anthropic" }).click();
  await expect(page.getByRole("link", { name: "Anthropic" })).not.toBeVisible();

  await page.reload();
  await expect(page.getByRole("link", { name: "Anthropic" })).not.toBeVisible();
});
```

- [ ] **Step 2: Run it and confirm it fails for the right reason**

```bash
npx playwright test tests/delete-bookmark.spec.ts
```

Expected: FAIL — no delete button exists yet.

- [ ] **Step 3: Add `deleteBookmark` to `db.ts`**

Append to `mid-sprint-project/app/lib/db.ts`:

```ts
export async function deleteBookmark(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("bookmarks").delete().eq("id", id);
  if (error) throw error;
}
```

- [ ] **Step 4: Add the delete Server Action**

Append to `mid-sprint-project/app/bookmarks/actions.ts`:

```ts
export async function deleteBookmarkAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing bookmark id");

  await deleteBookmark(id);
  revalidatePath("/bookmarks");
}
```

(Add `deleteBookmark` to the existing `import { createBookmark } from "@/app/lib/db";` line so it reads `import { createBookmark, deleteBookmark } from "@/app/lib/db";`.)

- [ ] **Step 5: Add the delete button to the list**

In `mid-sprint-project/app/bookmarks/page.tsx`, update the import line to `import { createBookmarkAction, deleteBookmarkAction } from "./actions";` and replace the `<ul>` block:

```tsx
      <ul className="flex flex-col gap-2">
        {bookmarks.map((b) => (
          <li key={b.id} className="border rounded p-2 flex justify-between items-center">
            <a href={b.url} className="underline">{b.title}</a>
            <form action={deleteBookmarkAction}>
              <input type="hidden" name="id" value={b.id} />
              <button type="submit" aria-label={`Delete ${b.title}`} className="text-sm underline">
                Delete
              </button>
            </form>
          </li>
        ))}
      </ul>
```

- [ ] **Step 6: Run the test again and confirm it passes**

```bash
npx playwright test tests/delete-bookmark.spec.ts
```

Expected: PASS. Then run the full suite to confirm nothing regressed:

```bash
npx playwright test
```

Expected: all 3 tests pass (`auth.spec.ts`, `create-bookmark.spec.ts`, `delete-bookmark.spec.ts`).

- [ ] **Step 7: Commit**

```bash
git add mid-sprint-project/app/lib mid-sprint-project/app/bookmarks mid-sprint-project/tests/delete-bookmark.spec.ts
git commit -m "Add delete bookmark"
```

---

## Task 8: Redeploy and re-verify as an incognito visitor

**Files:**
- No new files.

- [ ] **Step 1: Redeploy**

```bash
cd mid-sprint-project && vercel --prod
```

- [ ] **Step 2: Full incognito walkthrough**

Open the live URL in a fresh incognito window:
- Confirm it redirects to `/login` when signed out.
- Sign up as a new user.
- Save a bookmark, confirm it appears; reload, confirm it's still there.
- Delete it, confirm it disappears; reload, confirm it's still gone.
- Log out, confirm `/bookmarks` redirects to `/login` again when visited directly.

- [ ] **Step 3: Update the README**

Confirm `mid-sprint-project/README.md`'s live URL is current (update if the domain changed).

- [ ] **Step 4: Commit (only if the README changed)**

```bash
git add mid-sprint-project/README.md
git commit -m "Confirm live deployment after delete feature"
```

---

## Task 9: Repoint `/security-scan` so it can target this app

**Problem:** `.claude/commands/security-scan.md` currently hardcodes `part1/` as the app under audit (see lines 5–16 of that file). Left as-is, running `/security-scan` now would silently re-scan `part1/` and report a false "clean" for this project. `vercel-security-scanner.md` already asks which directory if one isn't given (defaulting to `part1/` only as a fallback) — extend that same flexible pattern to the command file itself, rather than swapping one hardcoded path for another.

**Files:**
- Modify: `.claude/commands/security-scan.md`
- Modify: `.claude/agents/vercel-security-scanner.md`

- [ ] **Step 1: Make the command accept a target directory**

In `.claude/commands/security-scan.md`, replace:

```markdown
Run a full security audit of the app at `part1/` using all three scanner
subagents.

1. Dispatch all three in parallel — a single message with three Agent tool
   calls, not three separate messages:
   - `supabase-security-scanner` — audit `part1/` for RLS gaps, policy
     gaps, `service_role` key exposure, public storage buckets
   - `nextjs-security-scanner` — audit `part1/` for data crossing the
     server/client boundary, server-action auth gaps, IDOR risk
   - `vercel-security-scanner` — audit the Vercel deployment configuration
     for `part1/` (env var scoping, Deployment Protection, security
     headers, signs of a leaked secret)
```

with:

```markdown
Run a full security audit of one app in this repo using all three scanner
subagents.

Determine the target directory: if the user gave one as an argument, use
it. Otherwise ask which app to scan (this repo currently has `part1/` and
`mid-sprint-project/`) — never assume a default silently.

1. Dispatch all three in parallel — a single message with three Agent tool
   calls, not three separate messages, each told the target directory:
   - `supabase-security-scanner` — audit the target directory for RLS
     gaps, policy gaps, `service_role` key exposure, public storage buckets
   - `nextjs-security-scanner` — audit the target directory for data
     crossing the server/client boundary, server-action auth gaps, IDOR
     risk
   - `vercel-security-scanner` — audit the Vercel deployment configuration
     for the target directory (env var scoping, Deployment Protection,
     security headers, signs of a leaked secret)
```

- [ ] **Step 2: Update the fallback note in `vercel-security-scanner.md`**

In `.claude/agents/vercel-security-scanner.md`, replace:

```markdown
When invoked, audit the target app (ask which directory if not given — for
this repo it is `part1/`) and report findings grouped by severity: critical,
```

with:

```markdown
When invoked, audit the target app (ask which directory if not given — this
repo currently has `part1/` and `mid-sprint-project/`) and report findings
grouped by severity: critical,
```

- [ ] **Step 3: Commit**

```bash
git add .claude/commands/security-scan.md .claude/agents/vercel-security-scanner.md
git commit -m "Make /security-scan target-directory aware (repo now has two apps)"
```

---

## Task 10: Run the security scan and fix findings

- [ ] **Step 1: Run the full scan against this app**

In Claude Code, run:

```
/security-scan mid-sprint-project/
```

(Or run `/security-scan` and answer `mid-sprint-project/` when asked which app.)

- [ ] **Step 2: Fix every critical and high finding**

Work through the combined report from critical to high. Common things this specific app could plausibly be flagged for, given the plan above — verify each is actually clean, don't assume:
- `middleware.ts` matcher only covering `/bookmarks/:path*` — confirm no other route needs gating (there isn't one in this scope).
- `db.ts` is the only file calling `supabase.from("bookmarks")` — confirm no page/component bypasses it.
- No `SECURITY DEFINER` view or RPC exists (none was created in this plan — confirm the scanner agrees).
- `.env.local` never appears in `git log -p -- '**/.env*'` for this project's commits.

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "Fix findings from /security-scan on mid-sprint-project"
```

(If the scan comes back clean with nothing to fix, skip this step — don't create an empty commit.)

---

## Task 11: Fresh-context rescan and wrap-up

**Warning:** this rescan must run in a genuinely new Claude Code session — not a `/clear` in the same terminal tab if that doesn't fully reset agent memory, and not the same conversation that just made the fixes. An agent that carried the fix conversation tends to confirm its own patch rather than re-examine the files.

- [ ] **Step 1: Start a fresh Claude Code session**

Close the current session (or open a new terminal/window) and start a brand-new Claude Code session in `mid-sprint-project/` (or the repo root, then answer `mid-sprint-project/` when asked which app).

- [ ] **Step 2: Rescan**

```
/security-scan mid-sprint-project/
```

Expected: zero critical or high findings. If anything new turns up, fix it, commit, and rescan again in yet another fresh session — do not treat a same-session re-check as sufficient.

- [ ] **Step 3: Record the result**

Create `mid-sprint-project/REFLECTION.md`:

```markdown
# Reflection — Bookmarks App

Live URL: <paste from README>

## Security scan history

- First full `/security-scan`: <date> — <N> findings (<summary>)
- Fixes committed: <commit hash(es)>
- Fresh-context rescan: <date>, new session — <result: zero criticals/highs>

## Review checklist

- [x] ai-architect consulted on the structure before any feature was built
- [x] App deployed at a live Vercel URL; verified in an incognito window as a brand-new visitor
- [x] Sign-up, log-in, log-out all work; signed-out visitors cannot reach `/bookmarks` (verified both via the UI and by typing the URL directly)
- [x] `bookmarks` has RLS enabled and three owner-scoped policies, confirmed in the dashboard under Authentication > Policies
- [x] Full `/security-scan` run after build + deploy; fixes applied; clean rescan confirmed in a fresh context
- [x] `.env.local` not committed; no service role key in any `NEXT_PUBLIC_` variable or in the repository
```

- [ ] **Step 4: Commit**

```bash
git add mid-sprint-project/REFLECTION.md
git commit -m "Add mid-sprint project reflection and review checklist"
```

---

## Self-Review Notes

**Spec coverage** — every task requirement from the course task maps to a task above: multi-user/auth (Task 3), ai-architect pre-build consult (already done, noted in Global Constraints), RLS on every table (Task 5), migrations (Task 5), Vercel deploy with only the anon key (Tasks 4/8), incognito verification (Tasks 4/8), Playwright happy-path per feature (Tasks 3/6/7), `/security-scan` + fresh-context rescan (Tasks 9–11), `.env.local` never committed (Task 2, checked explicitly in Step 2b).

**Scope discipline** — no tags, no edit, no title auto-fetch anywhere in the plan, matching the user's explicit "minimal as possible" direction and ai-architect's SSRF flag.

**Type consistency** — `Bookmark` is defined once in Task 6 and only extended (never redefined) in Task 7; `createClient()` names match exactly between `lib/supabase/client.ts` and `lib/supabase/server.ts` (same name, different modules, matching `part1/`'s own convention); Server Action names (`signUpAction`, `logInAction`, `logOutAction`, `createBookmarkAction`, `deleteBookmarkAction`) are each defined once and imported by exact name in every later task that uses them.
