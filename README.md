# Applied Intelligence

An AI-powered application built on Next.js, Supabase, and the Anthropic Claude API.

**Status: foundation only — no features yet.**

---

## Setup

```bash
# 1. Clone the repo
git clone <repo-url>
cd applied-intelligence

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.local.example .env.local
# Open .env.local and fill in your Supabase and Anthropic credentials

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The landing page shows a green tick next to each env var that is present.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database / Auth | Supabase (`@supabase/ssr`) |
| AI | Anthropic Claude (`@anthropic-ai/sdk`) |
| Validation | Zod |
| Icons | Lucide React |

---

## Project Structure

```
src/
├── app/              # Next.js routes (App Router)
├── components/       # Shared UI components
├── lib/
│   ├── ai/           # Anthropic orchestration wrapper
│   ├── prompts/      # Prompt loading utilities
│   └── supabase/     # Supabase clients (server + browser)
└── types/            # Shared TypeScript types
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `ANTHROPIC_API_KEY` | Anthropic API key (server-only) |
