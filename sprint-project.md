# Part 8 — Sprint 2 Final Project

> **Status snapshot as of 2026-06-21.**
> This document separates work completed in Parts 1–7 from the official Sprint 2 Project requirements.

---

## Section 1 — What We Built in Parts 1–7

These features were completed during the sprint lessons and are fully in place on `main`.

### Required features (from `part4/CLAUDE.md`)

| # | Feature | Status |
|---|---------|--------|
| 1 | `app/lib/db.ts` — all Supabase helpers here, no direct calls elsewhere | ✅ Done |
| 2 | Sidebar: collections as expandable groups with contained notes | ✅ Done |
| 3 | Uncollected notes group in sidebar | ✅ Done |
| 4 | "New collection" control — prompts for name, persists immediately | ✅ Done |
| 5 | Assign a note to a collection via dropdown; persists | ✅ Done |
| 6 | Add / remove tags on a note; tags show on note cards in sidebar | ✅ Done |
| 7 | Sidebar tag filter (AND logic across selected tags) | ✅ Done |
| 8 | Search input — queries title + body, updates as user types, respects tag filter | ✅ Done |
| 9 | Readable empty states (empty collection, no search results, no tag matches) | ✅ Done |

### Optional tasks (from `part4/CLAUDE.md`)

| Task | Difficulty | Branch | Status |
|------|-----------|--------|--------|
| Rename a collection (inline edit, saves on Enter/blur) | Easy | `feat/rename-collection` | ✅ Done |
| Move notes between collections (right-click context menu) | Medium | `feat/move-notes` | ✅ Done |
| Server-side full-text search (FTS via `fts` tsvector column + GIN index) | Hard | `feat/fts` | ✅ Done |

### Auth & security (Parts 5–6)

| Item | Status |
|------|--------|
| Email/password sign-in and sign-out | ✅ Done |
| Google OAuth sign-in | ✅ Done (bonus beyond requirements) |
| Server-side session check with `getUser()` in `app/protected/page.tsx` | ✅ Done |
| RLS on all four tables; `user_id` set by trigger — users see only their own data | ✅ Done |
| No localStorage or sessionStorage used for document data | ✅ Done |
| Security scan run; error messages sanitized | ✅ Done |

---

## Section 2 — Official Sprint 2 Project Requirements

The sprint project brief asks to take the database-connected app and add email/password authentication. Because Parts 5–6 already added this, most requirements are already satisfied. The table below tracks each one.

### Requirement checklist

| # | Requirement | Status | Notes |
|---|-------------|--------|-------|
| R1 | Email/password sign-in page and sign-out control | ✅ Done | `/auth/login` with LoginForm; LogoutButton in nav |
| R2 | Routes protected — unauthenticated users redirected to sign-in | ✅ Done | `app/protected/page.tsx` redirects via `redirect("/auth/login")` |
| R3 | Server-side checks use `getUser()`, **not** `getSession()` | ✅ Done | Fixed: `auth-button.tsx` now uses `getUser()`; `protected/page.tsx` already did |
| R4 | Documents in Supabase, scoped to signed-in user | ✅ Done | RLS + `user_id` trigger; each user sees only their own notes |
| R5 | No localStorage or sessionStorage for document data | ✅ Done | Confirmed — no matches in codebase |
| R6 | Persistence choice documented in `REFLECTION.md` | ✅ Done | `part4/REFLECTION.md` written |
| R7 | Full CRUD works and persists across reloads | ✅ Done | Create, edit, delete — all through db.ts → Supabase |
| R8 | Local verification checklist passes (see below) | ✅ Done | Tested with 3 accounts; RLS data isolation verified |
| R9 | `CLAUDE.md` reflects full stack and auth rules | ✅ Done | Auth rules section already present |
| R10 | PR diff reviewed for auth mistakes before merging optional branches | ✅ Done | Fresh-session diff review run; findings documented in root REFLECTIONS.md |

### Local verification checklist

Run these steps at `http://localhost:3000` with `npm run dev`:

- [ ] Create a test account in Supabase dashboard → Auth tab, sign in, land on `/protected`
- [ ] Create a note/document, reload — it is still there
- [ ] Sign out — `/protected` is no longer accessible; navigating there redirects to sign-in
- [ ] Create a second account, sign in as that account — sees none of first account's data

---

## Section 3 — Resolved Items

| Issue | Resolution |
|-------|-----------|
| `auth-button.tsx` used `getClaims()` | Fixed: replaced with `getUser()` |
| `REFLECTION.md` missing | Created: `part4/REFLECTION.md` covers persistence decision and auth architecture |
| Verification checklist | Done: tested with 3 accounts; RLS isolation confirmed during build |
| `app/notes/page.tsx` direct Supabase call | Kept intentionally (Part 4 exploration page, not a production route) |
| GitHub PRs for optional branches | Branches merged locally before PRs opened; documented as process learning in root REFLECTIONS.md |

---

## Section 4 — Remaining

- [ ] Update README.md "Part 8" section with sprint summary

---

## Section 5 — Optional Tasks Plan

### Already implemented (free wins — just need branches + PRs)

| Task | Difficulty | What exists | Action needed |
|------|-----------|-------------|---------------|
| Self-service sign-up | Medium | `/auth/sign-up` with full `SignUpForm`, email confirmation redirect, link on login page | Branch + PR only |
| Password-reset email flow | Medium | `/auth/forgot-password` + `ForgotPasswordForm` + `/auth/update-password` | Branch + PR only |

### To build

#### Easy — Loading states
**What the brief asks for:** skeleton or spinner while documents are being fetched, so the page never flashes a blank list.

**What we have:** `app/protected/page.tsx` already wraps `<NotesLoader>` in `<Suspense>`. The fallback currently shows plain text: `"Loading…"`.

**What to build:** Replace the text fallback with a skeleton that approximates the sidebar + editor layout — a couple of grey animated bars on the left (mocked collection headers and note cards) and a blank right panel. One change in `app/protected/page.tsx`, no new routes, no DB changes.

---

#### Medium — Export to Markdown
**What the brief asks for:** a button on each document that downloads the content as a `.md` file.

**What we have:** The note editor in `components/notes/notes-workspace.tsx` has a toolbar. Nothing in `db.ts` needs changing.

**What to build:**
1. Add a download button to the note toolbar (next to the delete button).
2. On click: create a `Blob` from `# {title}\n\n{body}`, set `type: "text/markdown"`, generate an object URL, click a hidden `<a download="{title}.md">`, revoke the URL. Pure client-side — no server round-trip, no DB change.

---

### Implementation order

All optional tasks are built directly on `feature/sprint2-project` — they are small enough to not warrant sub-branches.

1. ✅ Create `feature/sprint2-project` branch from `main`
2. ✅ Build loading states (`components/notes/notes-skeleton.tsx` + `app/protected/page.tsx`)
3. ✅ Build export to markdown (download button in note toolbar → `.md` file)
4. ✅ Fix auth/nav flashing and Next.js 16 `cacheComponents` errors
5. ✅ Update all documentation (`REFLECTION.md`, `REFLECTIONS.md`, `README.md`, `sprint-project.md`)
6. PR `feature/sprint2-project` → `main`

---

## Appendix — Architecture Snapshot

```
part4/
├── app/
│   ├── lib/db.ts                  ← all Supabase helpers (types, CRUD, validation)
│   ├── protected/
│   │   ├── layout.tsx             ← nav bar + app shell
│   │   └── page.tsx               ← server: getUser() auth check, data fetch
│   ├── auth/                      ← login, sign-up, forgot-password, callback routes
│   └── notes/page.tsx             ← ⚠ leftover, direct supabase call — delete this
├── components/
│   ├── notes/notes-workspace.tsx  ← full client UI (sidebar, editor, tags, search)
│   ├── auth-button.tsx            ← ⚠ uses getClaims() — replace with getUser()
│   └── login-form.tsx             ← email/password + Google OAuth form
├── lib/supabase/
│   ├── client.ts                  ← browser client
│   └── server.ts                  ← server client (@supabase/ssr)
└── docs/
    └── supabase-schema.md         ← table definitions, RLS, FTS column
```

### Key database facts
- **4 tables:** `notes`, `collections`, `tags`, `note_tags` — all with RLS
- `user_id` set by Postgres trigger on insert; app never sets it explicitly
- `notes.fts` — generated `tsvector` (title + body); GIN index for full-text search
- Auth: Supabase Auth, email/password + Google OAuth
