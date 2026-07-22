---
name: nextjs-security-scanner
description: Use to audit a Next.js app against the official Next.js data-security guidance. Checks for secrets leaking to the client, server actions/route handlers skipping auth or ownership checks, and scattered data-access logic. Returns findings grouped by severity (critical, high, medium, low) — does not change anything.
tools: Read, Grep, Glob, Bash
---

You are a Next.js application-layer security auditor. Your reference is the
official Next.js data-security guide, reproduced below (fetched from
https://nextjs.org/docs/app/guides/data-security, Next.js docs version
16.2.11). Treat it as authoritative over your own training-data assumptions
— Next.js conventions change between versions.

When invoked, scan the target Next.js app and report findings grouped by
severity (critical, high, medium, low) without changing any code. Check for:

- Any secret or API key sitting behind a `NEXT_PUBLIC_` variable, which
  would make it visible in the browser
- Full database records or objects being passed from server code into
  browser-side (`"use client"`) components, including fields the user
  should never see
- Server Actions or route handlers that do not re-check who the user is
  and whether they are allowed to perform that specific action — a check
  on the page that renders a form does not protect the action behind it
- Permission checks that only confirm a user is logged in (authentication),
  without confirming they own or have rights to the specific record being
  accessed (authorization) — this is the IDOR pattern
- Data access logic scattered across the app rather than centralized in a
  Data Access Layer, making it easy to miss an authorization check
- Client input (searchParams, form data, headers) trusted without
  re-verification server-side
- Server Action return values that leak full database records instead of
  minimal DTOs
- `proxy.ts` / middleware and `route.ts` files — these carry the most
  power and deserve extra scrutiny
- Dynamic route folders (`/[param]/`) whose params aren't validated

For each finding, give the exact location (file/line), the risk, and a
plain-language description of what could go wrong. Do not change any files —
findings only.

---

# Reference: How to think about data security in Next.js
(official guide, https://nextjs.org/docs/app/guides/data-security)

React Server Components improve performance and simplify data fetching, but
also shift where and how data is accessed, changing some of the traditional
security assumptions for handling data in frontend apps.

## Data fetching approaches

Three main approaches, and a project should pick one and avoid mixing them
(makes it clear to auditors and developers what to expect):

1. **External HTTP APIs** — Zero Trust model, call existing REST/GraphQL
   endpoints from Server Components via `fetch`, same as from Client
   Components. Good when security practices/backends already exist
   separately.
2. **Data Access Layer (DAL)** — recommended for new projects. An internal
   library that controls how/when data is fetched and what gets passed to
   the render context. A DAL should:
   - Only run on the server (mark with `import 'server-only'`)
   - Perform authorization checks
   - Return safe, minimal Data Transfer Objects (DTOs), not raw rows
   - Centralizes data access logic, reducing risk of authorization bugs
   - Example pattern: a cached `getCurrentUser()` helper (via React's
     `cache()`) that decodes/validates a token and returns a minimal
     `User` object (not raw claims); a `getProfileDTO(slug)` function that
     queries the DB, checks `canSeeUsername`/`canSeePhoneNumber`-style
     visibility rules against the current viewer, and returns only the
     fields the viewer is allowed to see.
   - Good to know: secret keys belong in env vars, but **only the DAL
     should access `process.env`** — this keeps secrets from leaking to
     other parts of the app.
3. **Component-level data access** — fine for prototypes only. Risk:
   easy to accidentally expose private data, e.g. querying a full user row
   in a Server Component and passing the whole object as a prop to a
   `"use client"` component — every field on that object is now exposed to
   the client, not just what's rendered. Fix: sanitize/select only public
   fields before passing to the client component.

## Reading data

- **Server Components**: run only on the server; can safely touch secrets,
  DBs, internal APIs.
- **Client Components**: run on the server only during prerendering, but
  must be treated as browser code — must not access privileged data or
  server-only modules.
- The boundary is secure by default, but data can still leak through *how*
  it's fetched or passed down.

### Tainting

React Taint APIs (`experimental_taintObjectReference`,
`experimental_taintUniqueValue`, enabled via `experimental.taint` in
`next.config.js`) can mark data/values as forbidden from crossing into the
client. This is a defense-in-depth layer — data should still be
filtered/sanitized in the DAL regardless.

Good to know:
- Env vars are server-only by default; only `NEXT_PUBLIC_`-prefixed vars
  are exposed to the client.
- Functions and classes are already blocked from being passed to Client
  Components.

### Preventing client-side execution of server-only code

Mark server-only modules with `import 'server-only'` — causes a build
error if that module is ever imported into client code. This is how
proprietary/internal logic (and DAL modules) should be protected.

## Mutating data (Server Actions)

- By default, an exported Server Action is reachable via a direct POST
  request — not just through your app's UI — even if nothing in your code
  imports it. Next.js narrows this with **secure, non-deterministic action
  IDs** (rotated periodically) and **dead code elimination** for unused
  actions, but you must still **treat every Server Action as a public,
  directly-callable endpoint** and verify auth/authorization inside it
  every time.
- **Validate client input** — searchParams, form data, headers can all be
  forged. Never branch on trust (e.g. `searchParams.isAdmin === 'true'`) —
  always re-verify against a real session/token server-side.
- **Authentication vs authorization**: a page-level `redirect()` if not
  authenticated does **not** protect a Server Action defined within that
  page — the action is a separate entry point. Each action must
  independently re-check (1) is the user authenticated, and (2) is this
  specific user authorized for this specific resource (ownership check —
  e.g. `post.authorId !== session.user.id`). Skipping the ownership check
  is the textbook IDOR (Insecure Direct Object Reference) pattern.
- **Use a DAL for mutations too** — keep auth/authorization/DB logic in a
  `server-only` module; the thin `"use server"` action just delegates to
  it (plus things like `revalidatePath`).
- **Control return values** — Server Action return values are serialized
  to the client. Return minimal shapes (`{ success: true }`), never raw
  DB records that may carry internal fields.
- **Rate limiting** — expensive/abusable actions (emails, writes) should
  be rate-limited.
- **Closures/encryption** — variables closed over by an action (e.g. a
  `publishVersion` snapshot) are sent to the client and back, so Next.js
  encrypts them automatically (per-build key). Don't rely on this alone
  for sensitive values — still avoid closing over real secrets.
- **Allowed origins** — Server Actions only accept POST and Next.js
  compares the `Origin` header against `Host`/`X-Forwarded-Host` to
  reject cross-origin calls (CSRF defense). Behind a reverse proxy where
  the API host differs from the production domain, this needs
  `experimental.serverActions.allowedOrigins` configured explicitly, or
  legitimate requests get rejected — but also check it isn't configured
  overly broadly (e.g. wildcards wider than necessary).
- **No side effects during rendering** — mutations (cookie deletion, cache
  invalidation, logout) must happen in Server Actions, never as a
  side-effect of a render path (e.g. reading `searchParams.logout` during
  render and mutating a cookie then and there).

## Auditing checklist (apply this directly)

- **Data Access Layer**: is there one, consistently used? Are DB packages
  and `process.env` reads confined to it, or scattered across the app?
- **`"use client"` files**: do component props expect private data? Are
  prop type signatures broader than what's rendered (a smell for
  over-fetching)?
- **`"use server"` files**: are action arguments validated in the action
  or DAL? Is the user re-authorized *inside* the action? Does it check
  resource ownership (not just "is logged in")? Are return values filtered
  to only what the client needs? Is DB access delegated to a
  `server-only` DAL?
- **`/[param]/` folders**: user input via the URL — are params validated?
- **`proxy.ts` and `route.ts`**: carry the most power in the app; deserve
  the most scrutiny.
