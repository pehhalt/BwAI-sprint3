# Test Plan

## Mandatory manual tests

### Authentication

1. Open the app (locally, or the deployed URL if the deployment stretch goal was completed) in an incognito window.
2. Navigate directly to `/dashboard`.
3. Confirm redirect to `/login`.
4. Navigate directly to a known `/projects/[id]` URL.
5. Confirm redirect to `/login` there too.
6. Sign in and confirm `/dashboard` is accessible.
7. Sign out and confirm protected routes are inaccessible again.

### Real OpenRouter call

1. Create a project and section.
2. Enter source text and rewrite instructions.
3. Generate a rewrite.
4. Confirm the model output appears.
5. Refresh the page.
6. Confirm the output remains saved.
7. Confirm the browser network request does not contain `OPENROUTER_API_KEY`.

### Cross-user privacy

1. User A creates a project and rewrite.
2. Copy User A's project URL.
3. Sign in as User B.
4. Open the copied URL.
5. Confirm a generic not-found or unauthorized-safe response.
6. Confirm User B's dashboard does not list User A's project.

## Playwright tests

### Signed-out lockout

- Start without authenticated state.
- Navigate to `/dashboard` and to a direct `/projects/[id]` URL.
- Expect redirect or sign-in page in both cases.

### AI happy path

For routine CI, intercept or mock the application AI endpoint so tests are deterministic:

- Sign in with a test account.
- Create a project and section.
- Submit a rewrite.
- Return a controlled model response.
- Confirm it appears and is persisted.

Maintain one separate manual or non-default integration test that calls OpenRouter for real.

### Approval

- Create two rewrite versions.
- Approve the first.
- Approve the second.
- Confirm only the second is approved.
- Confirm preview displays the second.

## Security checks

- Search the built client assets for `OPENROUTER_API_KEY`.
- Search the repository for service-role key usage.
- Confirm every user table has RLS enabled.
- Confirm policies use `auth.uid()` ownership checks.
- Confirm production logs do not print source documents or full prompts.
