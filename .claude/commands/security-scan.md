---
description: Run all three security scanners (Supabase, Next.js, Vercel) in parallel against the full app and merge findings into one severity-grouped report
---

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

   Each scan is the whole app / whole deployment — do not scope any of
   them to a subset of files for this command (that's what
   `/security-scan-changed` is for).

2. Wait for all three to finish. Do not proceed until every one has
   reported back.

3. Combine their findings into a single report grouped by severity:
   **Critical**, **High**, **Medium**, **Low**. Within each severity
   tier, list each finding once with its location and risk, and note
   which scanner(s) flagged it. If the same underlying issue is flagged
   by more than one scanner (for example, a missing security header
   surfacing in both the Next.js and Vercel scans), merge it into a
   single entry rather than listing it twice — do not just concatenate
   the three raw reports.

4. Scanners report only. Do not change any code or Vercel project
   settings while running this command, regardless of what the scanners
   find — that's a separate step the user drives afterward.
