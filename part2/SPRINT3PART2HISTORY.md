# What I did in Sprint 3, Part 2

## Exercise: Deploy a Next.js app to Vercel

App: `vercel-deploy-lab`, scaffolded and deployed from its own separate
location/repo at `C:\Projects\TuringCollege\BwAI\vercel-deploy-lab`
(not nested inside this `BwAI-sprint3` repo, per the exercise's requirement
of a brand-new public GitHub repo).

### Setup (one-time tools)

- [x] Install Vercel CLI (`npm i -g vercel`)
- [x] Install `gh` CLI
- [x] Install Vercel's agent skill collection (`npx skills add vercel-labs/agent-skills`)
- [x] `vercel login` (as pehhalt)
- [x] `gh auth login` (as pehhalt)

### Build

- [x] Scaffold `create-next-app` at the new location, default settings
- [x] Add a page reading `NEXT_PUBLIC_GREETING` (fallback: "Hello from Vercel")
- [x] Verify locally (`npm run dev`) — fallback text confirmed rendering

### Ship it

- [x] `git init`, create public GitHub repo `vercel-deploy-lab` via `gh`, push `main` — https://github.com/pehhalt/vercel-deploy-lab
- [x] Import into Vercel, set `NEXT_PUBLIC_GREETING`, deploy — stable production URL: https://vercel-deploy-lab.vercel.app/ (each deployment also gets its own permanent hash URL, e.g. the first one at https://vercel-deploy-k4yg6o2av-tc-vercel-test.vercel.app/ — those never update, always use the stable alias)
- [x] Verify live URL — page loads, no functional console errors (only harmless Tailwind/Next.js compat + perf/security lint notices), greeting correctly shows the dashboard value, not the fallback

### Auto-deploy + preview loop

- [x] Add a "today's date" line, push to `main`, confirm auto-redeploy — caught along the way: Vercel Authentication (deployment protection) was on by default under the `TC-Vercel` team, silently blocking public access; turned off and confirmed genuinely public via a cookie-less `curl` (200 OK, correct content)
- [x] New branch `add-subtitle`, add the subtitle line, push, open a PR — https://github.com/pehhalt/vercel-deploy-lab/pull/1
- [x] Confirm Vercel's preview-URL comment on the PR, verify it doesn't touch production — preview URL public and shows subtitle (200), production confirmed to still have no subtitle

### Live URLs

Kept running rather than cleaned up (decided 2026-07-09) — revisit the
Cleanup checklist below whenever this is done being used.

| What | URL |
|---|---|
| GitHub repo | https://github.com/pehhalt/vercel-deploy-lab |
| Open PR (`add-subtitle` → `main`) | https://github.com/pehhalt/vercel-deploy-lab/pull/1 |
| **Production (stable — always current)** | **https://vercel-deploy-lab.vercel.app/** |
| Preview (`add-subtitle` branch) | https://vercel-deploy-lab-git-add-subtitle-tc-vercel-test.vercel.app/ |
| First deployment (frozen, pre-date/subtitle) | https://vercel-deploy-k4yg6o2av-tc-vercel-test.vercel.app/ |
| 2nd deployment (frozen, has date, no subtitle) | https://vercel-deploy-17rt1m84t-tc-vercel-test.vercel.app/ |
| Vercel project dashboard | https://vercel.com/tc-vercel-test/vercel-deploy-lab |

Only the **stable production URL** and the **preview URL** are meaningful
to actually visit — the two hash-specific deployment URLs are frozen
snapshots kept here just for reference, not something to bookmark.

Note: Vercel Authentication (deployment protection) was turned off for
this project so it's genuinely publicly reachable by anyone with the
URL — see the exercise's own warning about guessable `.vercel.app`
subdomains staying exposed indefinitely on Hobby. Fine short-term while
actively using it; don't forget the Cleanup section below.

### Cleanup

- [ ] Delete the preview deployment from the PR
- [ ] Delete the whole `vercel-deploy-lab` Vercel project
- [ ] Optionally delete the GitHub repo
