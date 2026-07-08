# Crafted Digital Mini OS

A clean, Supabase-ready starter for running the early Crafted Digital website agency workflow.

## Phase 1 included

- Vite + React app foundation
- React Router layout
- Simple design system and app shell
- Supabase client setup
- Auth screen with sign in / sign up
- Workspace model for Owner + Member
- Local preview fallback when Supabase keys are not set
- Starter Supabase SQL schema with RLS for:
  - profiles
  - workspaces
  - workspace_members

## Workflow this app is built around

Add Prospect → Build Demo → Send Demo → Follow Up → Mark Won

## Setup

```bash
pnpm install
cp .env.example .env
pnpm dev
```

## Connect Supabase

1. Create a new Supabase project.
2. Open the SQL editor.
3. Run `src/lib/schema.sql`.
4. Copy your project URL and anon key into `.env`:

```bash
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

5. Restart the dev server.

## Phase 2 next

- prospects table
- prospect list page
- prospect workspace page
- activity notes
- next follow-up tracking
