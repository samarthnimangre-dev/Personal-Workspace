import {
  getServices,
  getAssistantKnowledge,
  createInquiry,
  logAuditAction,
  Inquiry,
} from "@/lib/data-service";
import { notifyAdminOnTelegram } from "@/lib/telegram/client";
import { CONTACT_CONFIG } from "@/data/socials";
import { resolveGeminiApiKey } from "@/lib/gemini/client";
import { executeGeminiTurn } from "@/lib/telegram/gemini-agent";

export type ConversationPhase = "INITIAL" | "DISCOVERY" | "QUALIFICATION" | "CONFIRMED";

export interface LeadDraft {
  name?: string;
  handleOrEmail?: string;
  serviceRequested?: string;
  problemBrief?: string;
  timeline?: string;
  estimatedScope?: string;
}

export interface TelegramSession {
  chatId: string;
  username?: string;
  firstName?: string;
  phase: ConversationPhase;
  messagesCount: number;
  leadDraft: LeadDraft;
  lastActiveAt: number;
  inquiryId?: string;
  history: Array<{ role: "user" | "model"; text: string }>;
}

export interface AgentTurnResult {
  replyText: string;
  phase: ConversationPhase;
  leadDraft: LeadDraft;
  leadQualified: boolean;
  inquiryCreated?: Inquiry;
  latencyMs: number;
}

export interface UserContext {
  username?: string;
  firstName?: string;
  lastName?: string;
}

// In-memory conversation session store with 2-hour TTL
const sessionStore = new Map<string, TelegramSession>();
const SESSION_TTL_MS = 2 * 60 * 60 * 1000;

/**
 * Retrieve or initialize a conversation session for a given chat ID.
 */
export function getOrCreateSession(
  chatId: string | number,
  context?: UserContext
): TelegramSession {
  const key = String(chatId);
  const now = Date.now();
  const existing = sessionStore.get(key);

  if (existing && now - existing.lastActiveAt < SESSION_TTL_MS) {
    existing.lastActiveAt = now;
    if (context?.username && !existing.username) existing.username = context.username;
    if (context?.firstName && !existing.firstName) existing.firstName = context.firstName;
    if (!existing.history) existing.history = [];
    return existing;
  }

  const newSession: TelegramSession = {
    chatId: key,
    username: context?.username,
    firstName: context?.firstName,
    phase: "INITIAL",
    messagesCount: 0,
    leadDraft: {
      name: context?.firstName ? `${context.firstName}${context.lastName ? ` ${context.lastName}` : ""}` : undefined,
      handleOrEmail: context?.username ? `@${context.username}` : undefined,
    },
    lastActiveAt: now,
    history: [],
  };

  sessionStore.set(key, newSession);
  return newSession;
}

/**
 * Reset a session (used for testing or user restarting flow).
 */
export function resetSession(chatId: string | number): void {
  sessionStore.delete(String(chatId));
}

/**
 * Get the count of active sessions in memory.
 */
export function getActiveSessionCount(): number {
  const now = Date.now();
  let active = 0;
  for (const session of sessionStore.values()) {
    if (now - session.lastActiveAt < SESSION_TTL_MS) {
      active++;
    }
  }
  return active;
}

/**
 * Extract email address from input text.
 */
export function extractEmail(text: string): string | undefined {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
  const match = text.match(emailRegex);
  return match ? match[0].trim() : undefined;
}

/**
 * Extract Telegram handle or social handle from input text.
 */
export function extractHandle(text: string): string | undefined {
  const handleRegex = /(?:^|\s)@([a-zA-Z0-9_]{3,32})\b/;
  const match = text.match(handleRegex);
  return match ? `@${match[1]}` : undefined;
}

/**
 * Extract timeline signals from text.
 */
export function extractTimeline(text: string): string | undefined {
  const lower = text.toLowerCase();
  if (lower.includes("asap") || lower.includes("immediately") || lower.includes("urgent")) {
    return "ASAP / Immediate priority";
  }
  const weekMatch = text.match(/(\d+)\s*(?:-|to)?\s*(\d*)\s*weeks?/i);
  if (weekMatch) {
    return weekMatch[0].trim();
  }
  const monthMatch = text.match(/(\d+)\s*(?:-|to)?\s*(\d*)\s*months?/i);
  if (monthMatch) {
    return monthMatch[0].trim();
  }
  if (lower.includes("next week")) return "Next week";
  if (lower.includes("this month")) return "This month";
  if (lower.includes("end of month")) return "End of month";
  return undefined;
}

/**
 * Extract prospect's stated name if explicitly introduced.
 */
export function extractStatedName(text: string): string | undefined {
  const patterns = [
    /(?:my name is|i am|i'm|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    /(?:call me)\s+([A-Z][a-z]+)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return undefined;
}

/**
 * Match user request to one of Samarth's verified service offerings.
 */
export function matchService(text: string): { title: string; tagline: string; deliverables: string[] } {
  const lower = text.toLowerCase();

  if (
    lower.includes("bot") ||
    lower.includes("chat") ||
    lower.includes("assistant") ||
    lower.includes("ai agent") ||
    lower.includes("support bot") ||
    lower.includes("rag") ||
    lower.includes("llm")
  ) {
    return {
      title: "AI Chatbots & Assistants",
      tagline: "Helpful conversational tools grounded in your real business information",
      deliverables: [
        "Custom system prompt tailored to your brand voice",
        "Knowledge retrieval from your documents, FAQs, or site",
        "Lead collection and structured inquiry handoff",
        "Clean embed widget matching your website's design",
      ],
    };
  }

  if (
    lower.includes("automat") ||
    lower.includes("sync") ||
    lower.includes("crm") ||
    lower.includes("pipeline") ||
    lower.includes("workflow") ||
    lower.includes("zapier") ||
    lower.includes("make.com") ||
    lower.includes("n8n") ||
    lower.includes("webhook") ||
    lower.includes("stripe") ||
    lower.includes("slack")
  ) {
    return {
      title: "Workflow & Business Automation",
      tagline: "Connecting your software so repetitive tasks run themselves",
      deliverables: [
        "Multi-app triggers (Stripe, Slack, Notion, Airtable, Sheets)",
        "Automated lead triage and notification routing",
        "Scheduled data syncs and background batch processing",
        "Reliable error handling and alert notifications",
      ],
    };
  }

  if (
    lower.includes("website") ||
    lower.includes("landing page") ||
    lower.includes("web app") ||
    lower.includes("frontend") ||
    lower.includes("next.js") ||
    lower.includes("react") ||
    lower.includes("portfolio") ||
    lower.includes("redesign")
  ) {
    return {
      title: "Websites & Modern Web Applications",
      tagline: "Fast, responsive web experiences designed with care",
      deliverables: [
        "Mobile-first, responsive layouts tested across screen sizes",
        "Performance-conscious web engineering with zero bloat",
        "Clean metadata, OpenGraph tags, and SEO foundations",
        "Global deployment on Vercel with custom domain setup",
      ],
    };
  }

  if (
    lower.includes("mvp") ||
    lower.includes("prototype") ||
    lower.includes("idea") ||
    lower.includes("validate") ||
    lower.includes("proof of concept") ||
    lower.includes("poc")
  ) {
    return {
      title: "Rapid Prototypes & Working MVPs",
      tagline: "From concept to interactive software to validate your idea",
      deliverables: [
        "Quick turnaround from idea to functional demo link",
        "Interactive core flows to test with real users",
        "Clean, modular TypeScript code structured to grow",
        "Direct collaboration and regular preview updates",
      ],
    };
  }

  return {
    title: "Custom System Engineering",
    tagline: "Bespoke software, automation, and AI integrations",
    deliverables: [
      "Architecture scoping and technical feasibility analysis",
      "Production-grade TypeScript / Next.js / Supabase execution",
      "End-to-end testing and verified deliverables",
    ],
  };
}

/**
 * Check if the input message is a question directly about Samarth,
 * his background, tech stack, or philosophy.
 */
async function checkAssistantKnowledge(text: string): Promise<string | null> {
  const lower = text.toLowerCase().trim();

  // Guard: if message contains typical project brief tokens, do not treat as a simple FAQ
  if (
    (lower.includes("need") || lower.includes("want") || lower.includes("build") || lower.includes("hire") || lower.includes("looking for")) &&
    text.split(" ").length > 5
  ) {
    return null;
  }

  const knowledge = await getAssistantKnowledge();
  let bestMatch = null;
  let highestScore = 0;

  for (const item of knowledge) {
    let score = 0;
    for (const kw of item.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        score += kw.length;
      }
    }
    if (score > highestScore) {
      highestScore = score;
      bestMatch = item;
    }
  }

  if (bestMatch && highestScore >= 4) {
    return bestMatch.answer;
  }

  return null;
}

/**
 * Main AI Agent Reasoning Engine.
 * Processes multi-turn conversation, grounds against real portfolio capabilities,
 * extracts lead entities, and inserts confirmed inquiries into Supabase.
 */
export async function executeAgentTurn(
  chatId: string | number,
  incomingText: string,
  context?: UserContext
): Promise<AgentTurnResult> {
  const startTime = Date.now();
  const session = getOrCreateSession(chatId, context);
  session.messagesCount += 1;

  const raw = incomingText.trim();
  const lower = raw.toLowerCase();

  // 1. Check for command resets or starts
  if (lower === "/start" || lower === "/restart" || lower === "/reset") {
    session.phase = "INITIAL";
    session.history = [];
    session.leadDraft = {
      name: context?.firstName ? `${context.firstName}${context.lastName ? ` ${context.lastName}` : ""}` : undefined,
      handleOrEmail: context?.username ? `@${context.username}` : undefined,
    };
  }

  // 2. Check for Google Gemini Intelligence if configured
  const geminiApiKey = await resolveGeminiApiKey();
  if (geminiApiKey) {
    try {
      const geminiResult = await executeGeminiTurn(session, raw, context);
      return geminiResult;
    } catch (geminiError) {
      console.warn(
        "[Telegram Agent] Gemini intelligence unavailable or timed out. Falling back to deterministic engine:",
        geminiError
      );
    }
  }

  // 3. Extract entities greedily across all turns (Deterministic Fallback)
  const extractedEmail = extractEmail(raw);
  const extractedHandle = extractHandle(raw);
  const extractedTimeline = extractTimeline(raw);
  const extractedName = extractStatedName(raw);

  if (extractedEmail) session.leadDraft.handleOrEmail = extractedEmail;
  else if (extractedHandle && !session.leadDraft.handleOrEmail?.includes("@") && !session.leadDraft.handleOrEmail?.includes(".")) {
    session.leadDraft.handleOrEmail = extractedHandle;
  }

  if (extractedTimeline) session.leadDraft.timeline = extractedTimeline;
  if (extractedName) session.leadDraft.name = extractedName;

  // 3. Check for specific grounded questions before progressing state
  const faqAnswer = await checkAssistantKnowledge(raw);
  if (faqAnswer && session.messagesCount === 1) {
    const replyText = `${faqAnswer}\n\nAre you looking to build or automate something specific right now? Tell me about your project!`;
    session.phase = "DISCOVERY";
    return {
      replyText,
      phase: session.phase,
      leadDraft: session.leadDraft,
      leadQualified: false,
      latencyMs: Date.now() - startTime,
    };
  }

  // 4. Multi-Turn State Machine Execution
  let replyText = "";
  let leadQualified = false;
  let inquiryCreated: Inquiry | undefined = undefined;

  switch (session.phase) {
    case "INITIAL": {
      const greetingName = session.leadDraft.name || (session.firstName ? session.firstName : "there");
      replyText =
        `👋 Hey ${greetingName}! I'm Samarth's AI Qualifier.\n\n` +
        `Samarth builds production-ready digital systems: custom AI chatbots, multi-app workflow automations, modern Next.js web applications, and fast MVPs.\n\n` +
        `What kind of system or automation are you looking to build?`;
      session.phase = "DISCOVERY";
      break;
    }

    case "DISCOVERY": {
      // Analyze requirements and determine matched service
      const matched = matchService(raw);
      session.leadDraft.serviceRequested = matched.title;
      session.leadDraft.problemBrief = raw;

      // Check if timeline or contact was already provided in this same message
      const hasContact = !!session.leadDraft.handleOrEmail;
      const hasTimeline = !!session.leadDraft.timeline;

      if (hasContact && hasTimeline) {
        // Prospect provided all requirements in a single comprehensive message
        leadQualified = true;
        inquiryCreated = await createInquiry({
          name: session.leadDraft.name || session.firstName || `@${session.username || "telegram_user"}`,
          email: session.leadDraft.handleOrEmail?.includes("@") && !session.leadDraft.handleOrEmail.startsWith("@")
            ? session.leadDraft.handleOrEmail
            : undefined,
          contactMethod: `Telegram (@${session.username || "direct_client"})${session.leadDraft.handleOrEmail ? ` / ${session.leadDraft.handleOrEmail}` : ""}`,
          serviceRequested: session.leadDraft.serviceRequested,
          message:
            `[TELEGRAM AGENT INTAKE - COMPREHENSIVE]\n` +
            `• Service: ${session.leadDraft.serviceRequested}\n` +
            `• Brief: ${session.leadDraft.problemBrief}\n` +
            `• Target Timeline: ${session.leadDraft.timeline}\n` +
            `• Telegram Chat ID: ${session.chatId}\n` +
            `• Captured via Live Telegram Agent Engine.`,
        });

        logAuditAction(
          "TELEGRAM_LEAD_CAPTURED",
          "INQUIRY",
          inquiryCreated.id,
          "telegram-agent",
          { chatId: session.chatId, service: session.leadDraft.serviceRequested }
        );

        void notifyAdminOnTelegram({
          id: inquiryCreated.id,
          name: inquiryCreated.name,
          service: inquiryCreated.serviceRequested,
          contact: inquiryCreated.contactMethod,
          brief: session.leadDraft.problemBrief || raw,
        });

        session.inquiryId = inquiryCreated.id;
        session.phase = "CONFIRMED";

        replyText =
          `✅ Project brief logged directly to Samarth's Command Center!\n\n` +
          `• Target: ${session.leadDraft.serviceRequested}\n` +
          `• Timeline: ${session.leadDraft.timeline}\n` +
          `• Direct Contact: ${session.leadDraft.handleOrEmail || `@${session.username}`}\n\n` +
          `Samarth personally inspects every specification and will follow up with you within 24 hours with an architectural blueprint and scope breakdown.\n\n` +
          `📅 Want to pick a time to discuss right away? Schedule a 15-minute architecture call directly here: ${CONTACT_CONFIG.CAL_URL}`;
      } else {
        session.phase = "QUALIFICATION";
        replyText =
          `Understood! For ${matched.title}, Samarth focuses on ${matched.deliverables[0].toLowerCase()} and ${matched.deliverables[1].toLowerCase()}.\n\n` +
          `To finalize your brief for Samarth:\n` +
          `1. What is your target launch timeline (e.g. 2 weeks, ASAP, end of month)?\n` +
          `2. What is your best contact email or handle if you prefer follow-up outside Telegram?`;
      }
      break;
    }

    case "QUALIFICATION": {
      // Append additional context if provided
      if (!session.leadDraft.timeline && extractedTimeline) {
        session.leadDraft.timeline = extractedTimeline;
      } else if (!session.leadDraft.timeline) {
        session.leadDraft.timeline = raw;
      }

      if (!session.leadDraft.handleOrEmail && (extractedEmail || extractedHandle)) {
        session.leadDraft.handleOrEmail = extractedEmail || extractedHandle;
      }

      // If user hasn't explicitly supplied contact, fallback to Telegram handle or Chat ID
      const contactInfo =
        session.leadDraft.handleOrEmail ||
        (session.username ? `@${session.username}` : `Telegram ID: ${session.chatId}`);

      const clientName =
        session.leadDraft.name ||
        session.firstName ||
        (session.username ? `@${session.username}` : "Telegram Client");

      leadQualified = true;
      inquiryCreated = await createInquiry({
        name: clientName,
        email: session.leadDraft.handleOrEmail?.includes("@") && !session.leadDraft.handleOrEmail.startsWith("@")
          ? session.leadDraft.handleOrEmail
          : undefined,
        contactMethod: `Telegram (@${session.username || "direct_client"})${session.leadDraft.handleOrEmail ? ` / ${session.leadDraft.handleOrEmail}` : ""}`,
        serviceRequested: session.leadDraft.serviceRequested || "Custom System Engineering",
        message:
          `[TELEGRAM AGENT INTAKE]\n` +
          `• Service: ${session.leadDraft.serviceRequested || "Custom System Engineering"}\n` +
          `• Brief: ${session.leadDraft.problemBrief || "Direct conversation intake"}\n` +
          `• Additional Notes: ${raw}\n` +
          `• Target Timeline: ${session.leadDraft.timeline || "Not specified"}\n` +
          `• Telegram Chat ID: ${session.chatId}\n` +
          `• Contact: ${contactInfo}\n` +
          `• Captured via Live Telegram Agent Engine.`,
      });

      logAuditAction(
        "TELEGRAM_LEAD_CAPTURED",
        "INQUIRY",
        inquiryCreated.id,
        "telegram-agent",
        { chatId: session.chatId, service: session.leadDraft.serviceRequested }
      );

      void notifyAdminOnTelegram({
        id: inquiryCreated.id,
        name: inquiryCreated.name,
        service: inquiryCreated.serviceRequested,
        contact: inquiryCreated.contactMethod,
        brief: session.leadDraft.problemBrief || raw,
      });

      session.inquiryId = inquiryCreated.id;
      session.phase = "CONFIRMED";

      replyText =
        `✅ Your project brief has been logged directly into Samarth's Command Center!\n\n` +
        `• System: ${session.leadDraft.serviceRequested}\n` +
        `• Timeline: ${session.leadDraft.timeline}\n` +
        `• Reference ID: #${inquiryCreated.id.slice(-6)}\n\n` +
        `Samarth personally reviews all requirements and will follow up with you within 24 hours with an architectural blueprint.\n\n` +
        `📅 Lock in a 15-minute architecture slot directly on his live calendar: ${CONTACT_CONFIG.CAL_URL}\n\n` +
        `If you have any additional links, repos, or documents, feel free to send them here anytime!`;
      break;
    }

    case "CONFIRMED": {
      // User sent further messages after confirmation
      if (faqAnswer) {
        replyText = `${faqAnswer}\n\nYour earlier project brief is already saved in Samarth's queue. Anything else you'd like to attach?`;
      } else {
        replyText =
          `Got it! I've noted this additional detail for your project brief. Samarth will review it alongside your inquiry.`;
      }
      break;
    }
  }

  // Record deterministic turn into session history
  if (!session.history) session.history = [];
  session.history.push({ role: "user", text: raw });
  session.history.push({ role: "model", text: replyText });

  const latencyMs = Date.now() - startTime;

  return {
    replyText,
    phase: session.phase,
    leadDraft: session.leadDraft,
    leadQualified,
    inquiryCreated,
    latencyMs,
  };
}
