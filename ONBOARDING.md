# GeoEx Copilot — Onboarding Guide

Welcome to the **GeoEx AI Platform Copilot**, an AI-powered operations assistant for [Geographic Expeditions (GeoEx)](https://www.geoex.com/), a premium adventure travel company. This guide will get you up to speed quickly.

---

## What Is This?

A Next.js 14 web app that gives GeoEx staff (trip managers, relationship managers, marketing, comms) a **ChatGPT-style copilot** backed by Anthropic's Claude. Staff can ask natural-language questions about trips, travelers, documents, payments, and suppliers — and get rich, interactive answers (tables, charts, checklists, alerts).

Key capabilities:
- **Chat interface** with real-time SSE streaming from Claude
- **Workflow library** with 30+ pre-built operational workflows
- **Document & payment compliance** tracking across trips
- **Customer intelligence** — churn risk, LTV, loyalty tiers
- **Supplier health monitoring** — SLAs, incidents, sentiment
- **Multi-role UI** — prompts and views adapt to the logged-in user's role

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set your Anthropic API key
export ANTHROPIC_API_KEY="sk-ant-..."

# 3. Start the dev server (runs on port 3003)
npm run dev

# 4. Open http://localhost:3003
```

> **No database required.** The app runs entirely on in-memory seed data for demo purposes.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS 3.4 + Radix UI primitives |
| AI | Anthropic Claude API (`claude-sonnet-4-20250514`) |
| Streaming | Server-Sent Events (SSE) on Edge runtime |
| Charts | Recharts |
| Icons | Lucide React |
| State | React hooks (no Redux/Zustand) |

---

## Project Structure

```
geoex-copilot/
├── app/
│   ├── layout.tsx              # Root layout (metadata, fonts)
│   ├── page.tsx                # Main app — chat UI, state management
│   ├── globals.css             # Tailwind base + custom scrollbar styles
│   └── api/chat/
│       └── route.ts            # Claude API integration (Edge, SSE)
│
├── components/
│   ├── ai/                     # Chat components
│   │   ├── PromptBar.tsx       # Input bar with role-specific placeholders
│   │   ├── ResponseThread.tsx  # Message history with pin/drill-down
│   │   ├── ResponseRenderer.tsx# Parses AI JSON → rich UI components
│   │   ├── PinnedItems.tsx     # Saved messages sidebar
│   │   ├── SuggestedPrompts.tsx# Quick-action prompt chips
│   │   └── SelectionToolbar.tsx# Copy / drill-down on selected text
│   ├── data-display/           # Rich data visualization
│   │   ├── DataTable.tsx       # Sortable tables
│   │   ├── StatusCard.tsx      # Metric cards (good/warning/critical)
│   │   ├── Checklist.tsx       # Audit result checklists
│   │   ├── ChartWrapper.tsx    # Bar, line, pie charts (Recharts)
│   │   ├── AlertBanner.tsx     # High-priority alert banners
│   │   ├── ActionCard.tsx      # CTA cards with action buttons
│   │   ├── CustomerProfile.tsx # Customer intelligence card
│   │   └── TripDashboard.tsx   # Trip readiness overview
│   ├── layout/                 # Page chrome
│   │   ├── Header.tsx          # Top nav, view toggle, user picker
│   │   ├── NotificationPanel.tsx# Slide-out notification drawer
│   │   └── UserSelector.tsx    # Switch between 5 demo users
│   ├── workflow/               # Workflow library
│   │   ├── WorkflowLibrary.tsx # Browse, search, filter workflows
│   │   ├── WorkflowCard.tsx    # Individual workflow card
│   │   ├── WorkflowDetailPanel.tsx # Expanded workflow view
│   │   ├── WorkflowProgress.tsx# Real-time step tracker
│   │   └── SystemBadge.tsx     # System integration label
│   ├── shared/                 # Reusable UI utilities
│   │   ├── EntityLink.tsx      # Clickable entity names
│   │   └── StatusBadge.tsx     # Color-coded status pills
│   └── ui/                     # Base primitives (Shadcn/Radix)
│       ├── button.tsx, card.tsx, input.tsx, badge.tsx
│       ├── avatar.tsx, tooltip.tsx, separator.tsx, scroll-area.tsx
│
├── lib/
│   ├── ai/
│   │   ├── system-prompt.ts    # Claude's system instructions & UI specs
│   │   ├── tools.ts            # 8 tool definitions Claude can call
│   │   └── tool-handlers.ts    # Maps tool calls → query functions
│   ├── data/
│   │   ├── types.ts            # All TypeScript interfaces
│   │   ├── queries.ts          # Filtering & aggregation logic
│   │   ├── workflows.ts        # 30+ workflow definitions
│   │   ├── seed-trips.ts       # 5 demo trips
│   │   ├── seed-contacts.ts    # 30+ demo travelers
│   │   ├── seed-members.ts     # 100+ group memberships
│   │   ├── seed-notifications.ts
│   │   ├── seed-staff.ts       # 5 demo staff
│   │   ├── seed-suppliers.ts   # 5 demo suppliers
│   │   └── seed-agent-logs.ts
│   ├── utils.ts                # cn(), formatCurrency(), formatDate(), etc.
│   └── icons.ts                # Lucide icon mappings by category/system
│
├── package.json
├── tailwind.config.ts          # Brand colors, custom theme
├── tsconfig.json               # Strict TS, @/* path alias
└── next.config.js
```

---

## How It Works (Data Flow)

```
User types a question (or clicks "Run" on a workflow)
         │
         ▼
POST /api/chat  ─── messages[] + userRole ───▶  Claude Sonnet
         │                                         │
         │                                   Tool calls (up to 10 rounds):
         │                                   search_trips, run_audit,
         │                                   get_customer_profile, etc.
         │                                         │
         │                                   Tool handlers run queries
         │                                   against seed data
         │                                         │
         ◀──── SSE stream ────────────────────────-┘
         │
    ResponseRenderer parses JSON components
    from Claude's text response
         │
         ▼
    Rich UI: tables, charts, alerts, checklists, action cards
```

**SSE event types:**
- `{ type: "status", message, toolNames[] }` — progress indicator
- `{ type: "delta", text }` — streamed text chunks
- `{ type: "done" }` — response complete
- `{ type: "error", message }` — error handling

---

## Key Concepts

### User Roles

The app ships with 5 demo users. Switch between them via the avatar in the header:

| Name | Role | Focus Area |
|------|------|------------|
| Heather Walsh | Manager | Weekly audits, team workload, KPIs |
| Sarah Chen | GSM | Documents, trip readiness, travelers |
| Jessica Torres | GSM | Documents, trip readiness, travelers |
| Michael Brooks | RM | Customer relationships, churn, referrals |
| Katia Novak | Marketing | Campaigns, conversion, destination trends |

### AI Tools (what Claude can do)

| Tool | Purpose |
|------|---------|
| `search_trips` | Filter trips by destination, status, readiness, date |
| `get_trip_detail` | Full trip breakdown: members, docs, payments, alerts |
| `search_travelers` | Find contacts by name, tier, risk, document status |
| `get_customer_profile` | Deep customer view: LTV, churn risk, trip history |
| `run_audit` | Compliance checks: documents, payments, insurance, readiness |
| `get_notifications` | Retrieve alerts by type and severity |
| `generate_follow_up` | Draft emails, call scripts, or texts for travelers |
| `get_aggregate_metrics` | Aggregate stats grouped by trip, tier, or supplier |

### Workflow Categories

| Category | Examples |
|----------|----------|
| Document Audits | Missing docs, passport expiry, waiver status |
| Traveler Management | Unresponsive travelers, follow-ups, dietary prefs |
| Trip Operations | Departing soon, low readiness, weekly audit |
| Customer Relations | Churn risk, high-LTV review, referral candidates |
| Payments & Finance | Deposit status, insurance compliance, revenue forecast |
| Supplier Management | Performance review, SLA compliance, incidents |
| Communications | Email campaigns, pre-departure checklists |
| Reports & Analytics | Workload dashboard, destination trends |
| Group Departures | Group operations workflows |

### GeoEx Systems Referenced

The copilot references these internal systems in workflows and tool calls:

| System | Purpose |
|--------|---------|
| **Sugati** | Core trip/booking management (CRM) |
| **Pax Cal** | Passenger calculator — pricing & group logistics |
| **Compass** | Internal knowledge base |
| **Asana** | Task and project management |
| **Domo** | Business intelligence dashboards |
| **Email** | Outbound communications |

---

## Common Dev Tasks

### Adding a new AI tool

1. Define the tool schema in `lib/ai/tools.ts`
2. Add the handler in `lib/ai/tool-handlers.ts`
3. Implement the query logic in `lib/data/queries.ts`
4. Update `lib/ai/system-prompt.ts` if Claude needs guidance on when to use it

### Adding a new data-display component

1. Create the component in `components/data-display/`
2. Register it in `components/ai/ResponseRenderer.tsx` so Claude's JSON output renders it
3. Document the JSON shape in `lib/ai/system-prompt.ts` so Claude knows the format

### Adding a new workflow

1. Add the definition to `lib/data/workflows.ts` (follow the `WorkflowDefinition` type)
2. Assign it to a category, list the systems and steps
3. Write the `prompt` field — this is what gets sent to Claude when the user clicks "Run"

### Adding seed data

All seed data lives in `lib/data/seed-*.ts`. Add new trips, contacts, members, suppliers, or notifications there. The query functions in `queries.ts` will automatically pick them up.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key for Claude |

---

## Scripts

```bash
npm run dev      # Start dev server on port 3003
npm run build    # Production build
npm start        # Start production server
npm run lint     # Run ESLint
```

---

## Tips

- **No database** — everything is seed data in TypeScript files. Great for rapid prototyping, but nothing persists between reloads.
- **Edge runtime** — the chat API runs on Vercel's Edge Runtime for long-lived SSE connections. Keep this in mind if adding heavy server-side logic.
- **ResponseRenderer** is the bridge between Claude's text output and the rich UI. If components aren't rendering, check there first.
- **`@/*` path alias** — import from project root, e.g., `import { cn } from "@/lib/utils"`.
- **Brand colors** are defined in `tailwind.config.ts` under `brand-amber`, `brand-green`, `brand-slate`, `brand-sand`, `brand-warmGray`.
