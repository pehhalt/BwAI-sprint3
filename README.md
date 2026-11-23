Building with AI – Sprint 3 (Turing College, 2026)

This repository contains my work from Sprint 3 of the Turing College course Building with AI: full-stack web apps with Next.js and Supabase, built with AI coding agents (Claude Code). I defined the concepts, directed the implementation and reviewed and tested the results.

Start here: the main project is in sprint-project/.

⭐ Main project: Script Rewriter

AI-assisted revision of educational course material: a multi-user web app.

Users create private projects, paste in sections of existing teaching material, define pedagogical rewriting rules and let an LLM (via OpenRouter) generate an improved version of each section. They can then edit and approve a version per section and assemble the approved sections into a printable script.

Real AI rewrite in the running app

Highlights

Controlled LLM output: the system prompt sets explicit rules. The model must keep the factual scope, define terms before using them, keep figure placeholders exactly as they are and never invent citations or sources.
Human in the loop: every AI version can be edited, regenerated and must be approved before it goes into the final script.
Security and privacy: Supabase Auth, Row Level Security on every table, an automated test that one user cannot see another user's data, the API key only on the server, and production security headers.
Testing: Vitest for prompt building and validation, and Playwright end-to-end tests for signed-out lockout, the rewrite happy path and isolation between users.
Scoped as an MVP: RAG, PDF parsing and real-time collaboration were left out on purpose and are documented as such.

Stack: Next.js 16 (App Router, TypeScript) · Tailwind CSS · Supabase (Auth, Postgres, RLS) · OpenRouter · Vercel · Vitest · Playwright

Live demo: https://script-rewriter-rho.vercel.app (sign-up required)

➡️ Full documentation: sprint-project/README.md

Course exercises

These folders contain the smaller exercises and write-ups from the sprint. They document how I learned, not finished products.

Folder	Content
part1/	Notes app (Next.js + Supabase Auth), the base for the following exercises
part2/	Deploying to Vercel (the app is in a separate repo: vercel-deploy-lab)
part3/	Security subagents: specialised AI agents that audit Supabase security
part4/	Testing with Playwright and Playwright MCP
part6/, part7/	Plans for an AI chatbot with memory and agentic RAG ("chat with your notes"), documented but not implemented within the sprint
mid-sprint-project/	Mid-sprint project: bookmarks app

.claude/ and .agents/ contain the shared agent configuration (subagents, skills) used across all parts.

About me

Peter Ehhalt: IT consultant with 30+ years in business analysis and requirements engineering, now focused on building LLM applications and AI prototypes. GitHub: @pehhalt

Course project, Turing College, Building with AI, 2026. Not a production product.
