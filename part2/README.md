# Sprint 3, Part 2 — Deploying to Vercel

This folder holds the write-up for the "Deploy a Next.js app to Vercel"
exercise. There's no app code here — the exercise specifically calls for a
throwaway app in its **own** separate GitHub repository, not nested inside
`BwAI-sprint3`, so the actual project lives outside this repo:

- **App:** `vercel-deploy-lab`, at `C:\Projects\TuringCollege\BwAI\vercel-deploy-lab` locally
- **Repo:** https://github.com/pehhalt/vercel-deploy-lab
- **Live URL:** https://vercel-deploy-lab.vercel.app/

## What this covers

A minimal Next.js app with a single page reading `NEXT_PUBLIC_GREETING`
(with a fallback), used to run through the full Vercel deploy loop once,
cleanly:

- Installing and authenticating the Vercel CLI and `gh` CLI
- Importing a GitHub repo into Vercel and setting environment variables
- Verifying a live deployment (including a **Deployment Protection** gotcha
  — "Vercel Authentication" was on by default under the course's Vercel
  team, silently gating the "public" URL behind a login wall until turned
  off)
- Auto-deploy on push to `main`
- Preview deployments on a branch/PR, without affecting production
- Understanding the difference between the stable production alias
  (`vercel-deploy-lab.vercel.app`) and a deployment's permanent,
  never-updating hash URL

See [`SPRINT3PART2HISTORY.md`](./SPRINT3PART2HISTORY.md) for the full
step-by-step checklist, all deployment URL variants, and the outstanding
cleanup steps (the app is intentionally being kept running for now rather
than torn down immediately).

## Why this matters for the real app

The notes app (`part1/`) never needed to go live for Sprint 2/3 — this
exercise was step one toward eventually deploying it for real. The key
carryovers, not covered by this throwaway exercise:

- The notes app can deploy from its existing location in this same repo
  (`part1/` as Vercel's **Root Directory**) — no separate repo needed,
  unlike `vercel-deploy-lab`
- Its actual env var names (`NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) must be set in Vercel, matching
  `part1/.env.local` exactly
- Deployment Protection will likely need turning off again for a new
  project under the same Vercel team
- Google OAuth sign-in requires adding the production URL to Supabase's
  and Google's allowed redirect URLs — something this exercise never
  exercised, since it has no auth
