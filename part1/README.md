# Notes App

A secure, cloud-based notes application built with Next.js and Supabase. Create, organize, and tag your notes with complete privacy — only you can see your data.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier works)

### Setup

1. **Clone and install dependencies:**
   ```bash
   cd part4
   npm install
   ```

2. **Configure Supabase:**
   - Create a `.env.local` file in the `part4/` directory
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
- **Search** — Find notes by title or content in real time

### Collections

- **Organize** — Group related notes into collections
- **Create collections** — Use the sidebar to add new collections
- **Move notes** — Assign notes to a collection via dropdown

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

## Support

For issues or feature requests, contact your administrator.

---

**Happy note-taking!** ✨
