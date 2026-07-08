# Notes App

A secure, cloud-based notes application built with Next.js and Supabase. Create, organize, and tag your notes with complete privacy — only you can see your data.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier works)

### Setup

1. **Clone and install dependencies:**
   ```bash
   cd sprint3/part1
   npm install
   ```

2. **Configure Supabase:**
   - Create a `.env.local` file in the `part1/` directory
   - Add your Supabase credentials:
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
     NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-public-key
     ```
   - Find these values in your Supabase project's **Settings → API**

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open the app:**
   - Navigate to `http://localhost:3000`
   - You'll see the sign-in page

## Authentication

### Sign In Options

You can create an account and sign in using:

- **Email & Password** — Traditional sign-up on the Sign Up page
- **Google** — Click "Sign in with Google" (faster, no password needed)

Both methods are equally secure and work with the same account data.

### First Time?

1. Go to **Sign up** 
2. Enter your email and create a password (or use Google)
3. Confirm your email (check your inbox for a confirmation link)
4. Sign in and start creating notes

## Features

### Notes

- **Create notes** — Click "New note" to start writing
- **Edit anytime** — Notes save automatically as you type
- **Rich text** — Add titles and body content
- **Search** — Server-side full-text search across title and body, powered by a Postgres `tsvector` column with a GIN index; results narrow in real time as you type
- **Export** — Download any note as a Markdown file

### Collections

- **Organize** — Group related notes into collections
- **Create collections** — Use the sidebar to add new collections
- **Rename collections** — Click the pencil icon next to a collection name in the sidebar; saves on Enter or blur
- **Move notes** — Assign notes to a collection via the dropdown in the note toolbar, or right-click a note card in the sidebar for a "Move to" context menu

### Tags

- **Tag notes** — Add multiple tags to any note
- **Filter by tags** — Click tag names to show only notes with those tags
- **Search + filter** — Combine search with tag filters

### Empty States

- **Empty collection** — Create your first note to get started
- **No search results** — Try different keywords
- **No tag matches** — Notes with these tags don't exist yet

## Privacy & Security

- **Only you can see your notes** — Row Level Security ensures complete data isolation
- **Automatic encryption** — All data is encrypted in transit (HTTPS)
- **No tracking** — No ads, analytics, or third-party integrations
- **Passwordless option** — Use Google sign-in for added convenience

## Troubleshooting

### Can't sign in?

- Check that you've confirmed your email (check spam folder)
- Make sure Caps Lock is off
- Try signing out and signing back in

### Missing notes after sign-in?

- Make sure you're signed in as the correct account
- Notes are private per user — signing in with a different email shows that user's notes only

### Seeing old data after switching accounts?

- Hard refresh your browser (`Ctrl+Shift+F5` or `Cmd+Shift+R`)
- Browser caches can show stale data when switching accounts

## Development

### Project subagents

`.claude/agents/` defines four project-scoped subagents used to review this
codebase:

- **ai-architect** — structural review; flags weak design choices before new features are added
- **ai-code-reviewer** — reviews a diff/commit range for dead code, duplication, and hidden behavior changes
- **ai-researcher** — read-only exploration and web research; returns a briefing, not a plan
- **security-auditor** — Supabase-specific security audit (RLS gaps, exposed keys, risky configs); loads the `supabase-security` project skill (`.claude/skills/supabase-security/SKILL.md`) as its reference

See `docs/notes-workspace-refactor.md` for how the first three were used to
audit and split `notes-workspace.tsx`, and `docs/supabase-security-audit.md`
for the security-auditor's findings and the fixes that followed.

### Optional-task branches

Per this project's workflow, optional tasks are built on a dedicated branch and merged via PR rather than committed straight to `main`. `feat/fts` (server-side full-text search) was completed this way.

## Support

For issues or feature requests, contact your administrator.

---

**Happy note-taking!** ✨
