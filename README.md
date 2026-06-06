# AI GitHub SaaS

Ship GitHub changes from an AI-powered workspace — connect a repo, describe the work, review generated files, then commit or open a PR without leaving the app.

## Features

- **Repo-aware planning** — Analyzes structure, branches, and conventions before proposing changes
- **AI code generation** — Generate files from natural language descriptions
- **Reviewable file diffs** — Preview changes before anything is pushed
- **GitHub delivery** — Create branches, commits, and pull requests directly

## Tech Stack

- [Next.js 14](https://nextjs.org/) (React, App Router)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.com/) (Auth + PostgreSQL)
- [OpenAI API](https://openai.com/) (code generation & planning)
- [Octokit](https://github.com/octokit/octokit.js) (GitHub API)
- [Vitest](https://vitest.dev/) (testing)

## Getting Started

### Prerequisites

- Node.js 18+
- [Supabase](https://supabase.com) project
- OpenAI API key
- GitHub OAuth App (for auth)

### Setup

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```

2. Copy the environment file and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

3. Run the Supabase migration from `supabase/migrations/00001_initial.sql`

4. Start the dev server:
   ```bash
   npm run dev
   ```

### Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `GEMINI_API_KEY` | AI provider API key |
| `ENCRYPTION_KEY` | 32-char hex key for encrypting GitHub tokens |
| `GITHUB_TOKEN` | *(optional)* GitHub PAT for local dev without OAuth |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
