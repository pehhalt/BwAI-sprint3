# Sprint 3, Part 6 — AI Chatbot with Memory

This folder holds the write-up for the "AI chatbot with memory" lesson.
Like `part3/` and `part4/`, there's no separate throwaway app here — the
task calls for building the chatbot **inside an existing Next.js +
Supabase application** rather than introducing a second architecture, so
the actual code changes land in whichever existing app is chosen as the
host (`part1/`'s notes app or `mid-sprint-project/`'s bookmarks app are
the two candidates in this repo — not yet decided; see
[`SPRINT3PART6HISTORY.md`](./SPRINT3PART6HISTORY.md)).

## What this covers

Build an AI chatbot that connects to a model through OpenRouter, keeps
conversational context turn-to-turn, and persists chat history in
Supabase. The course divides the work into five stages:

- **OpenRouter setup** — a server-side OpenAI-compatible client, reading
  `OPENROUTER_API_KEY` from `.env.local` (never `NEXT_PUBLIC_`-prefixed,
  never reachable from browser code), with the selected model kept in one
  configuration value (e.g. `export const AI_MODEL = "provider/model-slug"`)
  so switching providers means editing only that slug.
- **Chat UI and in-conversation memory** — a chat page with a scrollable
  message list, distinguishable user/assistant messages, a text input with
  a pending state, and a request pipeline that sends prior messages in the
  same conversation with each new call so the model can answer contextual
  follow-ups (e.g. "Can you explain that more simply?").
- **Supabase persistence** — conversations and messages stored as separate
  tables (a `conversations` record with an owner/session reference, and a
  `messages` record referencing it with role/content/order), so history
  survives a page refresh and a new conversation starts empty. Access
  control follows whatever auth model the host app already uses — a user
  must never be able to read or modify another user's conversations.
- **Model switching** — proving the one-config-value claim by actually
  swapping to a model from a different provider and confirming nothing
  else in the UI, persistence, or request pipeline needed to change.
- **Security and testing** — a repo-wide audit for accidental key
  exposure (no secret in client bundles, network responses, committed
  files, or Git history), two required Playwright tests (multi-turn
  context, and persistence across a refresh), committed on a feature
  branch with a diff review before merge.

## Non-negotiable security rule

Add this to the host app's `CLAUDE.md` (or equivalent) before writing any
code:

```markdown
## AI model calls

- All model calls must happen server-side only.
- Never call the OpenRouter API from browser code.
- `OPENROUTER_API_KEY` must be read from `.env.local` on the server.
- Never add a `NEXT_PUBLIC_` prefix to the OpenRouter key.
- Never pass the key to client components or return it in an API response.
```

## Prerequisites

Before starting, confirm the chosen host app already has:

- a working Next.js application and a configured Supabase project;
- Node.js and npm installed, with `npm run dev` working;
- Playwright available, or permission to add it;
- an OpenRouter account and API key; and
- a `.gitignore` entry covering `.env.local`.

## Required Playwright tests

- **Multi-turn context test** — send an initial message, wait for the
  assistant's response, send a follow-up that depends on it, and confirm
  the reply is contextually related rather than generic. Model output is
  non-deterministic, so avoid asserting an exact sentence — prefer a
  stable behavioral signal, a controlled test model/mock, or a response
  marker designed for testability.
- **Persistence test** — send at least two messages, refresh the page,
  and confirm both remain visible in the correct order.

Both must pass before the feature is committed.

## Definition of done

A working chat interface that maintains multi-turn context, persists
conversations in Supabase, changes models through one configuration
value, keeps every secret server-side, and passes both required
Playwright tests.

## Future extensions

This foundation can later be adapted into a document summarizer, support
assistant, writing helper, coding assistant, or retrieval-based
application grounded in a user's own data.

See [`SPRINT3PART6HISTORY.md`](./SPRINT3PART6HISTORY.md) for the current
status and the step-by-step log once work begins.
