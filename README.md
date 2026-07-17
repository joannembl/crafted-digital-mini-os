# Crafted Digital Mini OS

A modern operating system for running a website agency.

Crafted Digital Mini OS helps agencies discover local businesses, generate personalized demo websites, manage prospects, collaborate with team members, and convert leads into paying clients.

---

## ✨ Features

### CRM
- Prospect Management
- Pipeline
- Prospect Workspace
- Activity Timeline
- Notes
- Proposal Management

### Demo Builder
- AI Demo Studio
- **DemoForge Engine** — deterministic, no-AI demo generator with manual theme/layout selection
- Google Places Import
- Business Research
- Creative Brief Builder
- Demo Deployment to GitHub Pages
- Preview & Publish Workflow

### DemoForge Engine
A fully deterministic alternative to the AI generation path — no external AI provider, no network call, runs entirely from saved prospect data.

- **Theme + layout system** — themes are grouped by business category (automotive, detailing, cafe, restaurant, beauty, fitness, professional, local) with multiple visual variants per category; layouts (`split-impact`, `editorial-stack`, `angled-feature`, `local-story`) genuinely reorder page sections, not just recolor them
- **Manual override** — pick a specific theme/layout from the Demo Builder UI instead of relying on the automatic pick, or leave on Auto
- **Real-data-driven copy** — headline, hero highlight, and business description pull from actual saved fields (Google rating, review count, city parsed from address, Instagram/Facebook handles) instead of generic filler text; no invented claims when the data isn't there
- **Real hours** — condenses `google_opening_hours` into readable ranges (e.g. "Monday – Friday")
- **Real directions & reviews links** — "Get Directions" uses `google_maps_url` or the saved address; "Read reviews on Google" links out rather than fabricating testimonial quotes
- Shared file: `supabase/functions/_shared/demo-forge.ts` — imported by both the frontend (`ProspectsContext.jsx`) and the `generate-demo-ai` edge function, so the same engine powers the no-AI button and the AI-fallback path

> **Workflow note:** `deploy-demo-site` publishes whatever is saved in `demo_site_html`/`demo_site_css`, falling back to its own generic template only if those fields are empty. Always generate the demo (DemoForge or AI) *before* clicking Deploy, or the published site won't reflect what you built.

### Team Collaboration
- Multi-workspace support
- Owner / Member roles
- Invite Codes
- Workspace Settings
- Audit Logs

### Productivity
- Toast Notifications
- Confirmation Modals
- Unsaved Changes Protection
- Responsive UI
- Collapsible Sidebar
- Collapsible Workspace Sections

### Security
- Supabase Authentication
- Row Level Security (RLS)
- Workspace Isolation
- Protected Edge Functions
- Production Hardening

---

# Tech Stack

Frontend

- React
- Vite
- React Router
- Tailwind CSS
- Supabase JS

Backend

- Supabase
- Edge Functions (Deno)

Deployment

- GitHub Pages
- GitHub Actions

AI

Currently supported

- Google Places API
- Gemini (optional)
- OpenAI (optional)
- DemoForge (deterministic, no external AI required)

Future

- OpenRouter
- Claude
- Multi-provider AI Architecture

---

# Current Workflow

Import Business

↓

Research Business

↓

Create Creative Brief

↓

Generate Demo Website *(DemoForge or AI)*

↓

Deploy to GitHub Pages

↓

Email Prospect

↓

Follow Up

↓

Convert to Client

---

# Roadmap

## ✅ Completed

### Foundation

- Authentication
- Workspaces
- Prospect Management
- Pipeline
- Activities
- Notes

### Demo Builder

- Google Places Import
- Demo Deployment
- GitHub Pages Automation
- Creative Brief
- Demo Studio
- DemoForge Engine (deterministic, no-AI generation)
- Manual theme/layout selection
- Real Google data in generated copy (rating, reviews, hours, directions)

### UX

- Responsive Layout
- Sidebar Navigation
- Confirmation Modals
- Unsaved Changes
- Toast Notifications

### Security

- Production Hardening
- Audit Logs
- Error Boundary
- Security Indexes
- RLS Improvements

---

# Current Focus

## Phase 12+

The next evolution of Crafted Digital Mini OS is moving from a simple AI generator to an AI-powered Demo Studio — alongside continuing to make the no-AI DemoForge path richer on its own.

Planned improvements include:

- OpenRouter integration
- Claude support
- Multi-provider AI
- Brand-aware demo generation
- Website scraping
- Social media research
- Multiple design concepts
- AI-assisted deployment workflow
- Real Google review quotes (verbatim, sourced) as an opt-in DemoForge section
- More theme variants per category in DemoForge

---

# Vision

The goal of Crafted Digital Mini OS is simple:

> Generate a professional website demo for a local business in under five minutes.

Instead of building websites manually, the platform automates research, demo generation, deployment, and client management—allowing agencies to focus on winning more clients.

---

# Local Development

Install dependencies

```bash
pnpm install
```

Start development server

```bash
pnpm dev
```

Build

```bash
pnpm build
```

Deploy Edge Functions

```bash
supabase functions deploy
```

---

# Environment Variables

```
VITE_SUPABASE_URL=

VITE_SUPABASE_ANON_KEY=

GOOGLE_PLACES_API_KEY=

OPENROUTER_API_KEY=
```

---

# License

Private project.

© Crafted Digital