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

### Approval

Manually verified only (not an automated Playwright spec — matches this project's lean testing philosophy of 3 required specs plus targeted unit tests):

1. Create two rewrite versions for a section.
2. Approve the first.
3. Approve the second.
4. Confirm only the second is approved (and the first, if not manually edited, reverts to draft).
5. Confirm the preview displays the second.

### Delete project / delete section

Manually verified only, same rationale as above:

1. Create a project with at least one section and rewrite version.
2. Delete the section; confirm it disappears from the list and its rewrite versions are gone.
3. Delete the project; confirm it disappears from the dashboard and its remaining sections/rewrite versions are gone (cascading via the database's foreign keys, not manual application-level deletion).

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

## Security checks

- Search the built client assets for `OPENROUTER_API_KEY`.
- Search the repository for service-role key usage.
- Confirm every user table has RLS enabled.
- Confirm policies use `auth.uid()` ownership checks.
- Confirm production logs do not print source documents or full prompts.
