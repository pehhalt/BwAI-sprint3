# Sprint 3, Part 7 — Chat With Your Notes (Agentic RAG)

This folder holds the write-up for extending the Part 6 chatbot into a
secure "chat with your notes" system. Like `part6/`, there's no separate
throwaway app here — the work happens **inside `part1/`'s notes app**,
extending the chatbot built in Part 6 rather than introducing a second
architecture.

**Hard dependency: Part 6 must exist first.** This task extends "an
existing Next.js + Supabase chatbot" — that's the Part 6 feature. Since
Part 6 was deferred (see `part6/SPRINT3PART6HISTORY.md`), this part can't
start until Part 6's chatbot is actually built in `part1/`. See
[`SPRINT3PART7HISTORY.md`](./SPRINT3PART7HISTORY.md) for current status.

## What this covers

Upgrade the Part 6 chatbot in two stages:

1. **Classic RAG** — notes are chunked, embedded, and stored in Supabase
   with `pgvector`; a user's question is embedded, matched against their
   own chunks by similarity, and the matching chunks are supplied to the
   model as grounded context.
2. **Agentic RAG** — the model itself decides whether retrieval is
   necessary, can rewrite a weak search query, and retries when results
   are poor, instead of always retrieving unconditionally.

### Core RAG flow

**Ingestion** (on note create/update/delete):

- Split the note into overlapping chunks (~500 chars, ~100 char overlap,
  to avoid splitting important context at a boundary).
- Generate an embedding per chunk, store chunk + embedding + `note_id` +
  `user_id` in Supabase.
- Replace old chunks when a note is edited; delete chunks automatically
  when the source note is deleted (`on delete cascade`).

**Retrieval** (on a chat question):

- Decide whether the question needs the user's notes at all (skip
  retrieval for general-knowledge questions).
- Embed the query, retrieve the closest-matching chunks for *the current
  user only*, evaluate relevance, rewrite and retry if results are poor.
- Generate an answer grounded in the retrieved chunks and cite the source
  notes; say explicitly when nothing relevant was found — never fabricate.

## Non-negotiable configuration

Add this to `part1/CLAUDE.md` before writing any code:

```markdown
## Embeddings

- Use `openai/text-embedding-3-small` through OpenRouter's embeddings endpoint.
- Use the existing `OPENROUTER_API_KEY`.
- Generate embeddings server-side only.
- Store embeddings in a `vector(1536)` column.
- Use the same embedding model for document ingestion and query retrieval.
- Never change the embedding model without recreating the vector column and re-embedding every document.
```

Using different embedding models for ingestion vs. retrieval silently
breaks semantic search — there's no error, just bad results.

## Environment variables

The host app (`part1/`) should already have `OPENROUTER_API_KEY` (from
Part 6) plus its existing `NEXT_PUBLIC_SUPABASE_URL` /
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. `OPENROUTER_API_KEY` stays
server-side only — never `NEXT_PUBLIC_`-prefixed, never returned to the
browser.

## Database design

A new migration, reviewed before applying:

- enables the `vector` extension;
- creates a `documents` table (chunk `content`, `user_id`, `note_id`
  referencing `notes(id) on delete cascade`, `embedding vector(1536)`);
- enables RLS with per-user read/write policies;
- defines a `match_documents` function taking the query embedding, a
  similarity threshold, a max result count, and the authenticated user
  ID — returning only that user's rows, ordered by similarity, filtered
  by threshold.

Illustrative shape (adapt names/fields to `part1/`'s existing schema —
don't introduce a second architecture):

```sql
create extension if not exists vector;

create table documents (
  id bigserial primary key,
  content text not null,
  user_id uuid references auth.users not null,
  note_id bigint references notes(id) on delete cascade,
  embedding extensions.vector(1536) not null
);
```

Starting similarity threshold: ~0.75, tuned against real examples. Top
4–5 chunks retrieved per query.

## Implementation phases

1. **Vector store** — pgvector, `documents` table, `match_documents`, RLS
   with per-user policies, all in one reviewed migration.
2. **Note ingestion** — chunk/embed/store on save; re-embed on edit;
   confirm cascade delete removes chunks; all embedding calls server-side.
3. **Classic RAG** — embed question, retrieve top 4–5 chunks, answer must
   stay within retrieved context, cite notes, state explicitly when
   nothing relevant was found, preserve Part 6's in-conversation memory.
4. **Agentic RAG** — expose note search as a model-callable tool; model
   decides whether to search, answers general-knowledge questions
   without searching, rewrites/retries poor queries, strict per-user
   filtering on every search call.
5. **Security and testing** — verify cross-user isolation through the
   chat UI, direct endpoint calls, manipulated user IDs, retrieval tool
   calls, and RLS itself.

## Security requirements (part of the initial build, not hardening after)

- Every chunk has a `user_id`; every retrieval query filters by the
  authenticated user (defense in depth: application filter **and** RLS,
  both required).
- RLS enabled on `documents`, policies restrict reads/writes to the
  owning row.
- Server derives identity from the authenticated session — client-
  supplied user IDs are never trusted as authorization.
- Embedding generation stays server-side; no retrieval path may bypass
  the user filter.

## Expected chat behavior

- **Notes-related question** — e.g. a note states a venue and budget; a
  matching question returns the correct facts and identifies the source
  note.
- **No relevant note** — the assistant says it couldn't find relevant
  information; it must not invent an answer from general knowledge.
- **General-knowledge question** (e.g. "What is Paris the capital of?")
  — answered directly, without searching the user's notes.

## Required Playwright tests

1. **Happy path** — sign in, save a note with a distinctive fact, ask
   about it in chat, verify the response contains the fact and
   references the note.
2. **Nothing relevant** — ask something no saved note answers; verify the
   response says so and does not fabricate an answer.
3. **Cross-user isolation** — sign in as user A, save a note with a
   distinctive secret marker, sign out, sign in as user B, ask questions
   designed to surface user A's content, verify it never appears.

All three must pass before merging.

## Definition of done

Notes are reliably indexed after creation/editing with no stale chunks
after deletion; relevant questions produce grounded, cited answers;
missing information is reported honestly; the model searches only when
needed and can retry with a rewritten query; embedding code and keys stay
server-side; RLS + application filters prevent cross-user access; all
Playwright tests pass; the final branch review finds no unscoped
retrieval path.

## Final review before merge

Confirm: RLS enabled on `documents`; every retrieval call applies the
authenticated user filter; `openai/text-embedding-3-small` is pinned;
every vector uses 1,536 dimensions; OpenRouter embedding calls stay
server-side; stale embeddings are replaced after edits; the retrieval
tool cannot bypass user scoping; the cross-user isolation test passes.
Report concerns before merging rather than silently correcting
security-sensitive behavior.

See [`SPRINT3PART7HISTORY.md`](./SPRINT3PART7HISTORY.md) for the current
status and the step-by-step log once work begins.
