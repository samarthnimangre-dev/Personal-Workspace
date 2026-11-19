import { CONTACT_CONFIG } from "./socials";

export interface KnowledgeQnA {
  id: string;
  question: string;
  keywords: string[];
  answer: string;
  category?: "SERVICES" | "PRICING" | "TIMELINE" | "PAYMENT" | "PORTFOLIO" | "ABOUT" | "CONTACT";
}

export const assistantKnowledgeBase: KnowledgeQnA[] = [
  {
    id: "pricing-and-rates",
    question: "What are your rates and pricing models?",
    keywords: ["price", "pricing", "rate", "cost", "charge", "fees", "how much", "quote", "budget", "tier"],
    category: "PRICING",
    answer:
      "SAM CODES operates on transparent, milestone-driven pricing with 5 distinct tiers:\n" +
      "1. Micro-Fixes & Scripts: ₹1,000 – ₹2,500 ($15–$30 USD) | Same-day delivery (6–12 hrs)\n" +
      "2. Workflow & Business Automation: ₹5,000 – ₹12,000 ($70–$150 USD) | 24–48 hrs\n" +
      "3. AI Chatbots & Agents (WhatsApp/Telegram/Web): ₹8,000 – ₹18,000 ($100–$220 USD) | 2–4 days\n" +
      "4. Websites & Modern Web Apps: ₹12,000 – ₹25,000 ($150–$300 USD) | 3–5 days\n" +
      "5. Rapid MVPs & Prototypes: ₹25,000 – ₹50,000 ($300–$600 USD) | 5–10 days\n\n" +
      "Every project includes verified live previews before final payment.",
  },
  {
    id: "turnaround-and-timelines",
    question: "How fast can you start and deliver?",
    keywords: ["timeline", "turnaround", "fast", "urgent", "deadline", "how long", "speed", "delivery", "asap"],
    category: "TIMELINE",
    answer:
      "Sam specializes in rapid, surgical turnarounds:\n" +
      "• Urgent bug fixes & scrapers: Same-day delivery (often under 6–12 hours).\n" +
      "• Workflow automations: 24 to 48 hours.\n" +
      "• AI bots & web applications: 3 to 5 days.\n" +
      "Development starts immediately upon scoping agreement. You receive regular video walkthroughs and live staging preview links throughout the build.",
  },
  {
    id: "payment-methods-and-terms",
    question: "How does payment work and what payment methods do you accept?",
    keywords: ["payment", "pay", "upi", "paypal", "stripe", "bank", "deposit", "escrow", "terms", "method", "invoice"],
    category: "PAYMENT",
    answer:
      "Payment terms are structured for complete client confidence:\n" +
      "• India: Instant UPI transfer to `6361209256@ibl` or NEFT/IMPS bank transfer.\n" +
      "• International: PayPal, Stripe credit card invoice, or Wise direct transfer (USD/EUR/GBP).\n" +
      "• Structure: For micro-tasks, 100% on delivery after you test the working demo. For larger projects, standard 50% deposit and 50% upon final domain launch or code handoff.",
  },
  {
    id: "what-does-sam-build",
    question: "What does Sam build?",
    keywords: ["build", "create", "what", "services", "capabilities", "skills", "product", "offerings"],
    category: "SERVICES",
    answer:
      "Sam builds focused digital systems across 5 core areas: custom AI chatbots (Telegram, WhatsApp, Web), multi-app workflow automations (Stripe, Slack, Notion, Airtable), high-speed modern web applications (Next.js 15+, React, Tailwind CSS), rapid functional MVPs, and surgical micro-fixes / Python scraping scripts.",
  },
  {
    id: "show-me-sams-work",
    question: "Can I see previous work or live demos?",
    keywords: ["work", "projects", "lab", "portfolio", "examples", "case study", "show", "demo", "previous", "proof"],
    category: "PORTFOLIO",
    answer:
      "Under Sam's strict zero-fabrication policy, all showcased work is 100% verified and clickable:\n" +
      "• Production Portfolio: https://sam-codes.vercel.app\n" +
      "• Live E-Commerce Checkout Repair Demo: https://sam-codes.vercel.app/demos/dokumentko\n" +
      "• Autonomous Telegram AI Qualifier: @samarth_master_bot (~280ms latency, multi-turn reasoning)\n" +
      "• WhatsApp 24/7 Intake Bridge: +91 8550816706 (Baileys WebSocket Multi-Device)",
  },
  {
    id: "whatsapp-telegram-bot-building",
    question: "Can you build a WhatsApp or Telegram bot for my business?",
    keywords: ["whatsapp bot", "telegram bot", "bot", "auto-responder", "intake bot", "support bot", "ai agent"],
    category: "SERVICES",
    answer:
      "Yes! Sam builds production-grade WhatsApp and Telegram bots that run 24/7. Features include: automated lead qualification, instant push notifications to your personal phone whenever a client messages, FAQ answering grounded in your business documents, and CRM/database syncing (Supabase, Sheets, Notion). Turnaround is typically 2–4 days.",
  },
  {
    id: "tech-stack-and-tools",
    question: "What technologies and stack do you use?",
    keywords: ["stack", "technology", "tech", "languages", "frameworks", "tools", "python", "typescript", "nextjs"],
    category: "SERVICES",
    answer:
      "Sam builds with modern 2026 production tooling:\n" +
      "• Frontend: Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS v4, Motion.\n" +
      "• Backend & Scraping: Python 3.12+ (Asyncio, NumPy, Pandas, Playwright, Puppeteer), Node.js, TypeScript.\n" +
      "• Database & Auth: Supabase PostgreSQL (14 Tables, Row-Level Security, B-tree indexes, Automated Backups).\n" +
      "• AI & Cascades: Google Gemini 3.1 Flash Lite, Claude Code, OpenAI API, Model Context Protocol (MCP).\n" +
      "• Messaging & Edge: Baileys (WhatsApp Web Multi-Device), Telegram Bot API, Vercel Edge, Docker.",
  },
  {
    id: "guarantees-and-revisions",
    question: "Do you offer revisions and post-launch support?",
    keywords: ["revision", "support", "warranty", "guarantee", "maintenance", "bug", "refund"],
    category: "SERVICES",
    answer:
      "Every project includes 14 days of free post-launch support and bug fixes. If any unexpected error occurs, Sam patches it immediately at zero additional cost. Full milestone demos are provided before final payments so you only pay for software that works exactly as specified.",
  },
  {
    id: "how-to-work-with-sam",
    question: "How can I work with Sam and get started?",
    keywords: ["work", "hire", "contact", "reach", "collaborate", "start", "dm", "message", "telegram", "book", "whatsapp"],
    category: "CONTACT",
    answer:
      `Getting started takes less than 2 minutes:\n` +
      `1. WhatsApp: Message our 24/7 business intake line at +91 8550816706.\n` +
      `2. Telegram: Chat with our AI Qualifier (${CONTACT_CONFIG.TELEGRAM_BOT_HANDLE}) or DM Samarth directly (${CONTACT_CONFIG.TELEGRAM_PERSONAL_HANDLE}).\n` +
      `3. Email: Send your project notes to ${CONTACT_CONFIG.EMAIL_ADDRESS}.\n` +
      `4. Schedule a 15-Min Call: Book directly on Samarth's live calendar at ${CONTACT_CONFIG.CAL_URL}.\n\n` +
      `Share a brief summary of what you need built, and Samarth will provide an architectural blueprint and fixed quote within 2–4 hours.`,
  },
  {
    id: "book-discovery-call",
    question: "Can I book a discovery or architecture call with Samarth?",
    keywords: ["book", "call", "schedule", "calendar", "cal.com", "meeting", "discovery call", "consultation", "15min", "slot"],
    category: "CONTACT",
    answer:
      `Yes! You can book a 15-minute architecture & discovery consultation directly on Samarth's live calendar at ${CONTACT_CONFIG.CAL_URL}. Pick any available slot between Monday and Friday (9:00 AM – 5:00 PM IST) and a meeting invite with Cal Video / Google Meet will be automatically generated.`,
  },
  {
    id: "who-is-sam",
    question: "Who is Sam?",
    keywords: ["who", "sam", "samarth", "background", "about", "location", "student", "age", "years old"],
    category: "ABOUT",
    answer:
      "Sam (Samarth Nimangre) is a 17-year-old Systems & Automation Operator, Infrastructure Engineer, and AI Developer based in Karnataka, India. He builds high-reliability web scrapers, automated lead pipelines, hardened cloud databases, and autonomous AI agents with intense velocity and craftsmanship.",
  },
  {
    id: "b2b-lead-scraping",
    question: "How do your B2B lead generation and web scraping pipelines work?",
    keywords: ["scraper", "scraping", "lead gen", "apollo", "playwright", "enrichment", "leads", "crawler"],
    category: "SERVICES",
    answer:
      "Sam builds resilient asynchronous Python scraping engines (Playwright/Puppeteer) paired with Apollo search APIs, automatic proxy rotation, DOM schema change monitoring, and Google Sheets OAuth 2.0 sync. Leads are normalized, deduplicated, and routed with 99.8% schema accuracy.",
  },
  {
    id: "command-center-architecture",
    question: "What is the SAM CODES Administrative Command Center?",
    keywords: ["command center", "admin", "dashboard", "database", "rls", "security", "infrastructure"],
    category: "PORTFOLIO",
    answer:
      "The Command Center is a full-stack Next.js 16 administrative hub managing 14 Supabase PostgreSQL tables. It features zero-trust Row-Level Security, sliding-window IP rate limiters, Web Crypto HMAC-SHA256 session tokens, live telemetry tracking, and automated SHA-256 database backup routines.",
  },
  {
    id: "ecommerce-recommendation-engine",
    question: "Can you build recommendation systems or machine learning engines?",
    keywords: ["recommendation", "machine learning", "ml", "ecommerce", "cold start", "algorithm", "cosine"],
    category: "SERVICES",
    answer:
      "Yes! Sam engineered a hybrid e-commerce recommendation engine that solves the cold-start problem (where users have 0 history) using Bayesian average rating smoothing with category priors, and transitions to TF-IDF cosine feature similarity (70/30 hybrid scoring) for returning users.",
  },
];

/**
 * Deterministic Answer Resolver
 * Resolves user query against verified knowledge base with zero hallucination.
 */
export function queryDeterministicAssistant(
  query: string,
  knowledge: KnowledgeQnA[] = assistantKnowledgeBase
): string {
  const normalized = query.toLowerCase().trim();

  let bestMatch: KnowledgeQnA | null = null;
  let highestScore = 0;

  for (const item of knowledge) {
    let score = 0;
    for (const kw of item.keywords) {
      if (normalized.includes(kw)) {
        score += kw.length;
      }
    }
    if (score > highestScore) {
      highestScore = score;
      bestMatch = item;
    }
  }

  if (bestMatch && highestScore > 2) {
    return bestMatch.answer;
  }

  return `I only answer verified facts from Sam's engineering portfolio. Feel free to ask about our pricing tiers (₹1k micro-fixes to ₹25k MVPs), our same-day turnaround, or message Samarth directly on WhatsApp (+91 8550816706) or Telegram (@samarth_master_bot)!`;
}
