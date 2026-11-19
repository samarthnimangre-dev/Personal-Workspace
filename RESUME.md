# SAMARTH NIMANGRE
**AI Systems & Backend Infrastructure Engineer**  
Karnataka, India • [+91 6361209256](tel:+916361209256) • [samarthknimangre@gmail.com](mailto:samarthknimangre@gmail.com)  
[Portfolio: sam-codes.vercel.app](https://sam-codes.vercel.app) • [GitHub: github.com/Sam-CodesAI](https://github.com/Sam-CodesAI) • [LinkedIn: linkedin.com/in/sam-codesai](https://www.linkedin.com/in/sam-codesai/) • [Telegram: @Samarth1306](https://t.me/Samarth1306)

---

## ⚡ EXECUTIVE SUMMARY
High-autonomy Systems & AI Engineer specializing in low-level database internals, real-time edge streaming pipelines, and resilient distributed agentic architectures. Author of **SutraDB** (PyPI v2.2.1), a zero-dependency SIMD-accelerated hybrid vector database (<0.4ms P50 latency, 52k docs/s). Creator of **VaniEdge**, a sub-second edge voice telephony platform using Cloudflare Worker WebSockets, 8kHz μ-law audio transcoding, and 4-tier failover circuit breakers. Deep expertise in Python (Asyncio, NumPy BLAS, SIMD), TypeScript (Next.js 16, React 19, Node.js), and PostgreSQL (Row-Level Security).

---

## 🛠️ CORE TECHNICAL COMPETENCIES
- **Systems & AI Core:** SIMD Vector Distance, BM25 Lexical Indexing, Reciprocal Rank Fusion (RRF), Binary File Formats (mmap zero-copy, CRC32 WAL), Audio DSP (8kHz μ-law PCM), LLM Cascading & Dynamic Tool Calling, Grounded RAG.
- **Infrastructure & Distributed Systems:** Cloudflare Workers, Twilio TwiML / WebSockets, WebRTC, Supabase PostgreSQL (RLS, Migrations, Indexing), Docker, Redis/KV, Linux/Bash, Vercel Edge.
- **Languages & Frameworks:** Python 3.12+ (NumPy BLAS, Asyncio), TypeScript, Next.js 16 (App Router, Turbopack, Server Actions), React 19, Tailwind CSS v4, Node.js 22, SQL.
- **Reliability & Security:** Test-Driven Development (TDD), Circuit Breakers, Exponential Backoff with Jitter, Cryptographic HMAC-SHA1 / HMAC-SHA256, Webhook Fast-Ack.

---

## 🚀 FLAGSHIP PRODUCTION SYSTEMS & OPEN SOURCE

### **SutraDB (सूत्र DB) — Hybrid Vector Search & BM25 Lexical Engine**
*Zero-Dependency Embedded Vector Database* | [PyPI: sutradb v2.2.1](https://pypi.org/project/sutradb/) • [GitHub](https://github.com/Sam-CodesAI/SutraDB)
- Engineered a clean-room, zero-dependency hybrid vector database in Python & NumPy BLAS combining SIMD-accelerated linear algebra, Robertson-Spärck Jones BM25 lexical ranking, and dynamic in-flight compound metadata bitmasks.
- Pre-normalized unit vectors at insertion to reduce Cosine Similarity to pure hardware BLAS GEMV dot products, achieving **sub-0.4ms P50 latency** across 5,000 128-dim vectors.
- Designed 64-byte aligned **.sutra** binary container with zero-copy memory-mapped (`mmap`) reads and append-only CRC32 Write-Ahead Log (WAL), surviving cold restarts with zero data corruption.
- Sustained **52,000+ docs/sec** ingestion throughput with a ~22MB RAM footprint; published package to PyPI and verified via 100% passing 20/20 pytest test suite.

### **VaniEdge Voice Platform — Sub-Second Edge AI Voice Telephony & Failover**
*Production Edge Voice Telephony Engine* | [Live Demo: vaniedge.vercel.app](https://vaniedge.vercel.app) • [GitHub](https://github.com/Sam-CodesAI/VaniEdge-Voice-Platform)
- Architected sub-second edge voice telephony engine bridging Twilio PSTN carriers and browser WebRTC to AI LLMs via Cloudflare Worker WebSockets.
- Engineered bidirectional 8kHz μ-law PCM transcoding, sub-second TTFT/dead-air watchdogs, and zero-latency audio buffer flushing for seamless conversational barge-in.
- Designed 4-tier failover circuit breaker (Gemini matrix fallback → **<10ms Voicemail Circuit Breaker** → Warm Emergency Transfer → Autonomous SMS Rescue) eliminating dropped calls.
- Deployed customer dashboard with scrypt session cookies, tenant IDOR isolation, and instant Telegram admin alerts; verified via **70/70 passing automated tests**.

### **TeleFlow Agent — Autonomous Conversational Lead Qualification & Edge CRM Router**
*Multi-Turn Telephony & Messaging Workflow* | [GitHub: teleflow-agent](https://github.com/Sam-CodesAI/teleflow-agent)
- Built an autonomous multi-turn qualification agent on Next.js 16 edge webhooks achieving **sub-300ms turn latency** with zero external runtime dependencies.
- Integrated deterministic dual-database knowledge grounding (strict zero-knowledge truth) to eliminate LLM hallucinations on pricing and service scope.
- Automated dynamic Cal.com booking sync, real-time Telegram Bot admin alerts (`@Samarth1306`), and atomic Supabase PostgreSQL audit trail ingestion.

### **SAM CODES — Personal Platform & Administrative Command Center**
*Full-Stack Next.js 16 / React 19 Platform* | [Live Platform: sam-codes.vercel.app](https://sam-codes.vercel.app)
- Full-stack Next.js 16 administrative hub managing 14 Supabase PostgreSQL tables with zero-trust Row-Level Security (RLS) policies.
- Implemented edge Web Crypto HMAC-SHA256 session verification and sliding-window rate limiters; built automated SHA-256 database backup engine.

---

## 🎓 EDUCATION & WORK LOGISTICS
- **Pre-University / High School:** Science, Mathematics & Computer Science | Karnataka, India (Graduating 2026).
- **Work Availability & Roles:** Open for high-impact AI Systems, Backend Infrastructure, or Founding Engineer roles & contract builds. Highly autonomous asynchronous execution during US/EU/APAC overlapping hours.
