# Wordle (custom-word edition)

A NYT-style Wordle clone with one change: anyone can set the hidden word through a settings panel. Everyone else visiting the same URL tries to guess it.

Built with Next.js (App Router) + Vercel KV (Upstash Redis) for storage.

## How it works

- **One word at a time** — stored in a single KV key (`wordle:word`).
- **Status indicator** in the header shows whether a word is set.
- **Settings gear** opens a modal where you can view and change the current word.
- **Version counter** (`wordle:version`) bumps each time the word changes so players' in-progress games auto-reset.
- **Guess evaluation runs on the server**, so the answer doesn't leak into normal game network traffic. (Note: the settings modal fetches the word to pre-fill it, so a determined user can still inspect it — this is a casual game, not a secret keeper.)

## Local development

```bash
npm install
npm run dev
```

Without Vercel KV env vars set, the app falls back to in-memory storage for the dev process — the word persists only while `next dev` is running. That's fine for quickly trying it out locally.

To use real KV locally, install the Vercel CLI and pull env vars:

```bash
npx vercel link
npx vercel env pull .env.local
npm run dev
```

## Deploying to Vercel

1. Push this repo to GitHub.
2. In the Vercel dashboard, **Add New → Project** and import the repo.
3. Go to **Storage → Create Database → Upstash KV** (or "KV" / "Redis" depending on current branding) and connect it to the project. Vercel auto-injects `KV_REST_API_URL`, `KV_REST_API_TOKEN`, etc.
4. Redeploy (Vercel does this automatically after linking storage).

Everyone who visits the deployed URL shares the same single word.

## Project layout

```
app/
  page.tsx               main game UI (client component)
  layout.tsx             root layout + <html>/<body>
  globals.css            all styles
  components/
    Board.tsx            6x5 tile grid with flip animation
    Keyboard.tsx         on-screen keyboard with per-letter state
    SettingsModal.tsx    set/view/change the word
    Toast.tsx
  api/
    status/route.ts      GET { isSet, version }
    word/route.ts        GET { word } / POST { word }
    guess/route.ts       POST { guess } → { evaluation, correct }
lib/
  wordle.ts              evaluation algorithm + constants
  storage.ts             thin KV wrapper with in-memory fallback
```
