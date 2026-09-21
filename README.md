# SAM CODES — Personal Platform & Production Command Center

[![Next.js](https://img.shields.io/badge/Next.js-16.3.4-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.8-blue?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.3.3-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0.2-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_17-3ecf8e?logo=supabase)](https://supabase.com/)
[![SutraDB](https://img.shields.io/badge/PyPI-sutradb--core_v2.1.1-3776ab?logo=pypi)](https://pypi.org/project/sutradb-core/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **Live Production:** [sam-codes.vercel.app](https://sam-codes.vercel.app)  
> **Builder:** Samarth Nimangre (Sam) — 17, Student • AI Developer • Automation Builder • Systems Engineer  
> **Location:** Karnataka, India  
> **Direct Scoping:** [Telegram: @Samarth1306](https://t.me/Samarth1306) | [WhatsApp: +91 8550816706](https://wa.me/918550816706)

---

## ⚡ Overview

**SAM CODES** is the personal engineering platform, client acquisition engine, and administrative command center for **Samarth Nimangre**. Built with cutting-edge 2026 software architecture, the platform pairs a public-facing digital portfolio with autonomous 24/7 client intake agents and a private, cryptographically hardened command plane.

### 🎨 The Element Design Direction
- **Obsidian Palette:** Deep near-black background (`#04060c`) layered with restrained glass cards and sub-pixel micro-borders (`white/[0.06]`).
- **Electric Accents:** Luminescent electric cyan (`#00f0ff`) and subtle violet (`#8b5cf6`) glow signatures.
- **Hardware-Accelerated Canvas:** Custom ambient neural/grid particle field (`NeuralField.tsx`) responsive to pointer coordinates and device pixel ratio.
- **Contextual Cursor Interaction:** Magnetic tracking cursor (`ContextualCursor.tsx`) that snaps to interactive triggers, morphs states, and automatically yields on touchscreens.
- **Zero CLS & Sub-2s Load Times:** Zero Cumulative Layout Shift, static icon boundaries, and sub-2-second Time to Interactive (TTI).

---

## 🤖 24/7 Autonomous Agent Architecture

```
                              INCOMING CLIENT TOUCHPOINTS
               (Web Inquiries, Telegram Chats, WhatsApp Messages, Social Feeds)
                                            │
                                            ▼
                    ┌───────────────────────────────────────────────┐
                    │       Next.js 16 Turbopack & Edge Proxy       │
                    │         (src/proxy.ts + Security Headers)     │
                    └───────┬───────────────────────────────┬───────┘
                            │                               │
            ┌───────────────▼───────────────┐               │
            │ Public Presentation Engine    │               │
            │ • Element Obsidian Theme      │               │
            │ • Contextual Cursor Tracking  │               │
            │ • Hardware-Accelerated Canvas │               │
            │ • Floating 'Ask Sam' AI Agent │               │
            └───────────────┬───────────────┘               │
                            │                               │
    ┌───────────────────────┼───────────────────────────────┼───────────────────────┐
    ▼                       ▼                               ▼                       ▼
┌──────────────────┐  ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│ Telegram AI Bot  │  │ WhatsApp Daemon  │   │  The Lab Studios │   │ Admin Command    │
│ Gemini 3.1 Lite  │  │ Baileys Bridge   │   │  X / Reddit /    │   │ Center UI        │
│ Multi-turn CRM   │  │ +91 8550816706   │   │  LinkedIn OAuth  │   │ Session HMAC     │
└────────┬─────────┘  └────────┬─────────┘   └────────┬─────────┘   └────────┬─────────┘
         │                     │                      │                      │
         └─────────────────────┼──────────────────────┴──────────────────────┘
                               │
                               ▼
            ┌───────────────────────────────────────────────┐
            │         Data Abstraction & Resilience         │
            │           (src/lib/data-service.ts)           │
            ├───────────────────────────────┬───────────────┤
            │ Primary: Supabase PostgreSQL  │ Fallback:     │
            │ 14 Relational Tables + RLS    │ app-store.json│
            └───────────────────────────────┴───────────────┘
```

### 1. Telegram 24/7 AI Lead Qualifier Bot
- **Webhook Endpoint:** `/api/telegram/webhook` with `X-Telegram-Bot-Api-Secret-Token` verification.
- **Intelligence:** Google Gemini 3.1 Flash Lite (`src/lib/telegram/gemini-agent.ts`) with deterministic fallback rules.
- **State Machine:** 5-phase session tracker (`INIT` → `NEED_DISCOVERY` → `BUDGET_DISCOVERY` → `QUALIFIED` → `HANDOFF`).
- **Autonomous CRM:** Extracts requirements, timelines, and budgets in INR/USD; commits them to Supabase `inquiries`; and sends real-time markdown alerts to Samarth on Telegram (`@Samarth1306`).

### 2. WhatsApp Multi-Device Companion Bridge
- **Engine:** Built with `@whiskeysockets/baileys` running against intake number `+91 8550816706`.
- **Cloud State Sync:** Serializes session state into Supabase `site_settings` for instant recovery on headless Docker containers (Render, Fly.io, Railway).
- **Grounded Sales Catalog:** Real-time pricing, deliverables, and turnaround times quoted directly from the database without model hallucination.
- **Turnkey Container:** Complete standalone `Dockerfile.whatsapp` and `render.yaml` configuration.

### 3. The Lab — Multi-Platform Social Studio
- **X (Twitter):** OAuth 2.0 PKCE + RFC 3986 OAuth 1.0a HMAC-SHA1 signer for automated dispatch on `@Sam_CodeAI`.
- **Reddit Studio:** OAuth 2.0 PKCE token management with automated refresh for `u/SamarthBuilds_`.
- **LinkedIn Studio:** OAuth 2.0 UGC post publisher for cross-broadcasting engineering milestones.

---

## 🔬 Embedded High-Performance Projects

1. **[SutraDB (सूत्र DB)](SutraDB/):** Ultra-fast, zero-dependency hybrid vector search + BM25 lexical engine written in pure Python. Published to PyPI as [`sutradb-core`](https://pypi.org/project/sutradb-core/) (v2.1.1). Achieves 0.36ms P50 latency with SIMD BLAS acceleration and dynamic bitmask filtering.
2. **[Twilio Voice Agent Failover](projects/Twilio-Voice-Agent-Failover/):** Cloudflare Worker edge failover router for real-time Twilio voice pipelines with automated Vitest suites.
3. **[E-Commerce Recommendation Engine](projects/ecommerce-recommendation-engine/):** Machine learning system solving cold-start product recommendations with complete turnkey deployment package.
4. **[VaniEdge AI](projects/vaniedge-ai/):** Multilingual voice studio with WebRTC audio streaming, in-RAM vector search, and dynamic personas.

---

## 🔐 Security & Hardening Architecture

- **Next.js 16 Edge Proxy Boundary (`src/proxy.ts`):** Edge interception for `/admin/*` and `/api/admin/*`, cross-origin CSRF verification on mutating HTTP methods, and automatic response hardening headers.
- **Web Crypto HMAC-SHA256 Sessions (`src/lib/auth-token.ts`):** Tamper-proof, cryptographically signed cookies with clock skew tolerance and secure attribute enforcement.
- **Constant-Time Verification (`src/lib/auth-service.ts`):** Administrative secret validation executed via `crypto.timingSafeEqual` over SHA-256 digests to prevent timing attacks.
- **Row-Level Security (RLS) Isolation:** All 14 Supabase tables are secured under strict RLS policies. The `site_settings` table defaults to `is_public: false` to ensure credentials, tokens, and session keys are never exposed via the public anon key.
- **Sliding-Window Rate Limiting (`src/lib/rate-limiter.ts`):** Dedicated IP rate limiting on login (5 attempts / 15 min), contact submissions (5 inquiries / 10 min), and analytics telemetry (60 events / min).

---

## 🛠️ Stack & Technologies

| Layer | Technologies |
| :--- | :--- |
| **Framework & Core** | Next.js 16.3.4 (App Router, Turbopack), React 19.2.8, Node.js 26 |
| **Language & Typings**| Strict TypeScript 7.0.2 (Zero `any`, strict null checks) |
| **Styling & Theme**   | Tailwind CSS 4.3.3 (CSS-first Oxide engine, Obsidian `#04060c` palette) |
| **Animation & Icons** | Motion 13.2.0 (`motion/react`), Lucide React 1.41.0 |
| **Database & Auth**   | Supabase (PostgreSQL 17, PostgREST 14.5, `@supabase/ssr`, RLS) |
| **AI Inference**      | Google Gemini 3.1 Flash Lite API (`@google/genai` compatible REST) |
| **Messaging Daemons** | `@whiskeysockets/baileys` 6.7.24, Telegram Bot API |
| **Search Engine**     | SutraDB (`sutradb-core` 2.1.1) Vector + BM25 Hybrid Engine |

---

## 📂 Project Structure

```
├── Dockerfile.whatsapp          # Standalone 24/7 WhatsApp bridge container
├── render.yaml                  # Cloud deployment blueprint for companion daemons
├── package.json                 # Project dependencies & scripts (v1.2.0)
├── next.config.ts               # Next.js 16 configuration
├── tsconfig.json                # TypeScript strict configuration
├── scripts/
│   ├── backup-db.ts             # Standalone CLI database backup exporter
│   ├── start-whatsapp-bridge.ts # WhatsApp Baileys daemon launcher
│   ├── sync-whatsapp-auth.ts    # WhatsApp credentials to Supabase cloud sync
│   └── reddit-loop.ts           # Reddit lead scouting script
├── SutraDB/                     # सूत्र DB — Pure Python hybrid vector + BM25 engine
│   ├── pyproject.toml           # PyPI package configuration (sutradb-core 2.1.1)
│   ├── sutradb/                 # Core engine (ann, bm25, fusion, filters, storage)
│   └── tests/                   # Performance benchmarks and unit tests
├── projects/
│   ├── Twilio-Voice-Agent-Failover/     # Cloudflare Worker edge failover
│   ├── ecommerce-recommendation-engine/ # ML cold-start recommendation engine
│   └── vaniedge-ai/                     # Multilingual voice AI studio
├── supabase/
│   └── migrations/
│       ├── 20260905_command_center.sql         # 14 Tables, RLS, indexes, UUIDs
│       ├── 20260906_harden_security.sql         # Schema constraints & query indexes
│       ├── 20260907000000_fix_project_constraints.sql # Lifecycle status expansion
│       └── 20260921_patch_security_settings.sql   # Private-by-default credential RLS
├── src/
│   ├── proxy.ts                 # Next.js 16 Edge request boundary & CSRF guard
│   ├── app/
│   │   ├── globals.css          # Tailwind CSS v4 tokens & Element palette
│   │   ├── layout.tsx           # Root layout, metadata, ambient glows, cursor
│   │   ├── page.tsx             # Public Bento Grid portfolio & evidence lab
│   │   ├── admin/               # SAM CODES // COMMAND CENTER
│   │   │   ├── layout.tsx       # Admin shell & navigation
│   │   │   ├── page.tsx         # Executive metrics & platform pulse
│   │   │   ├── analytics/       # First-party privacy analytics viewer
│   │   │   ├── assistant/       # Grounded Q&A knowledge base editor
│   │   │   ├── capabilities/    # Tech stack & builder pillars editor
│   │   │   ├── inquiries/       # Client CRM pipeline & lead triage
│   │   │   ├── login/           # Rate-limited admin authentication portal
│   │   │   ├── projects/        # Project editor & publication manager
│   │   │   ├── services/        # Service tiers & pricing catalog editor
│   │   │   ├── settings/        # System configuration & feature flags
│   │   │   └── system/          # Diagnostics, secret status, and backup runner
│   │   ├── api/
│   │   │   ├── admin/           # Authenticated admin CRUD & social studio APIs
│   │   │   ├── analytics/event/ # Rate-limited telemetry ingestion
│   │   │   ├── contact/         # Honeypot-shielded contact form endpoint
│   │   │   └── telegram/        # Webhook receiver & outbound dispatcher
│   │   └── demos/               # Commercial client demo prototypes
│   ├── components/              # Element design system components
│   │   ├── ContextualCursor.tsx # Magnetic hardware-accelerated cursor
│   │   ├── NeuralField.tsx      # Ambient interactive neural canvas
│   │   ├── AskSamAssistant.tsx  # Grounded Q&A assistant drawer
│   │   ├── Hero.tsx             # Element Bento hero with live status pill
│   │   ├── LabSection.tsx       # Live evidence & verified build catalog
│   │   └── admin/               # Command Center UI (CommandPalette, SaveBar, etc.)
│   ├── data/                    # Static seed models & deterministic fallback data
│   └── lib/                     # Backend services & integration clients
│       ├── auth-service.ts      # Timing-safe authentication & session manager
│       ├── auth-token.ts        # Web Crypto HMAC-SHA256 token engine
│       ├── data-service.ts      # Dual-persistence database & resilience layer
│       ├── rate-limiter.ts      # Sliding-window IP rate limiter
│       ├── gemini/              # Google Gemini 3.1 Flash Lite client
│       ├── telegram/            # Multi-turn state machine & bot client
│       ├── whatsapp/            # Baileys daemon & cloud auth synchronizer
│       ├── twitter/             # X OAuth 2.0 PKCE & OAuth 1.0a signer
│       ├── reddit/              # Reddit OAuth 2.0 token manager
│       ├── linkedin/            # LinkedIn UGC broadcasting client
│       └── supabase/            # Server & admin client factories
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js:** 22+ (for native TypeScript stripping support)
- **Package Manager:** `pnpm` (recommended) or `npm`

### Installation

```bash
# Clone the repository
git clone https://github.com/Sam-CodesAI/Sam-Codes.git
cd Sam-Codes

# Install dependencies
pnpm install

# Set up local environment variables
cp .env.example .env.local

# Run development server
pnpm dev
```

- Public Site: [http://localhost:3000](http://localhost:3000)
- Command Center: [http://localhost:3000/admin](http://localhost:3000/admin)

### Available Scripts

```bash
# Verify TypeScript compilation
pnpm typecheck

# Build optimized production bundle
pnpm build

# Start production server
pnpm start

# Run database backup to disk
pnpm db:backup

# Start 24/7 WhatsApp AI companion bridge
pnpm whatsapp

# Sync local WhatsApp credentials to Supabase cloud
pnpm whatsapp:sync
```

---

## 🔐 Environment Configuration

| Variable | Scope | Purpose |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anonymous client API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server Secret | Supabase admin key for authenticated mutations |
| `ADMIN_SECRET_KEY` | Server Secret | Master credential for Command Center login |
| `ADMIN_EMAILS` | Server Config | Comma-separated whitelist of authorized administrator emails |
| `TELEGRAM_BOT_TOKEN` | Server Secret | Telegram bot token from @BotFather |
| `TELEGRAM_ADMIN_CHAT_ID` | Server Config | Samarth's personal Telegram chat ID for instant lead alerts |
| `TELEGRAM_WEBHOOK_SECRET` | Server Secret | Secret header token for Telegram webhook validation |
| `GEMINI_API_KEY` | Server Secret | Google AI Studio key for Gemini 3.1 Flash Lite inference |
| `REDDIT_CLIENT_ID` | Server Secret | Reddit Developer App Client ID |
| `REDDIT_CLIENT_SECRET` | Server Secret | Reddit Developer App Client Secret |
| `TWITTER_CLIENT_ID` | Server Secret | Twitter / X Developer App Client ID |
| `TWITTER_CLIENT_SECRET` | Server Secret | Twitter / X Developer App Client Secret |

---

## 📬 Connect & Direct Inquiries

- **Live Platform:** [https://sam-codes.vercel.app](https://sam-codes.vercel.app)
- **Telegram (Fastest Response):** [@Samarth1306](https://t.me/Samarth1306)
- **WhatsApp:** [+91 8550816706](https://wa.me/918550816706)
- **X (Twitter):** [@Sam_CodeAI](https://x.com/Sam_CodeAI)
- **Reddit:** [u/SamarthBuilds_](https://www.reddit.com/user/SamarthBuilds_/)
- **LinkedIn:** [Samarth Nimangre](https://www.linkedin.com/in/sam-codesai)
- **Email:** [samarthknimangre@gmail.com](mailto:samarthknimangre@gmail.com)

---

## 📄 License

MIT © [Samarth Nimangre (SAM CODES)](https://github.com/Sam-CodesAI/Sam-Codes)
