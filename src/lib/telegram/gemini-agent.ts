/**
 * Grounded Gemini Intelligence Engine for Telegram Bot
 * Provides natural multi-turn conversation, portfolio grounding,
 * structured entity extraction, and automated Supabase inquiry generation.
 */

import {
  callGeminiApi,
  resolveGeminiApiKey,
  GeminiMessage,
} from "@/lib/gemini/client";
import {
  createInquiry,
  logAuditAction,
  getServices,
  getAssistantKnowledge,
  getProjects,
  Inquiry,
} from "@/lib/data-service";
import { notifyAdminOnTelegram } from "@/lib/telegram/client";
import { getAvailableSlots } from "@/lib/cal/client";
import { CONTACT_CONFIG } from "@/data/socials";
import { profileData } from "@/data/profile";
import {
  type TelegramSession,
  type AgentTurnResult,
  type UserContext,
  type ConversationPhase,
  type LeadDraft,
  extractEmail,
  extractHandle,
  extractTimeline,
  extractStatedName,
  matchService,
} from "@/lib/telegram/agent";

interface GeminiExtractionResponse {
  replyText: string;
  extractedLead?: {
    name?: string;
    handleOrEmail?: string;
    serviceRequested?: string;
    problemBrief?: string;
    timeline?: string;
    estimatedScope?: string;
  };
  readyToQualify?: boolean;
  suggestedPhase?: ConversationPhase;
}

/**
 * Build dynamically grounded system instructions containing all real portfolio context.
 */
async function buildSystemPrompt(userContext?: UserContext): Promise<string> {
  const [services, knowledge, projects, liveSlots] = await Promise.all([
    getServices(),
    getAssistantKnowledge(),
    getProjects(),
    getAvailableSlots(2).catch(() => []),
  ]);

  const liveSlotsText =
    liveSlots.length > 0
      ? `\n• Live Available Slots from Samarth's Connected Google Calendar:\n` +
        liveSlots
          .slice(0, 6)
          .map((s) => `  - ${s.date} at ${s.istTime}`)
          .join("\n") +
        `\n  Direct booking link: ${CONTACT_CONFIG.CAL_URL}\n`
      : "";

  const servicesText = services
    .map(
      (s) =>
        `• ${s.title}: ${s.pricing?.inr || "₹1,000+"} (${s.pricing?.usd || "$15+"}) | Turnaround: ${s.pricing?.turnaround || "24-48h"}\n  Deliverables: ${s.deliverables.slice(0, 3).join(", ")}`
    )
    .join("\n\n");

  const projectsText = projects
    .slice(0, 5)
    .map(
      (p) =>
        `• ${p.title} (${p.category}): ${p.shortDescription}\n  Technologies: ${p.technologies.join(", ")}`
    )
    .join("\n\n");

  const faqsText = knowledge
    .map((k) => `Q: ${k.question}\nA: ${k.answer}`)
    .join("\n\n");

  const userNameHint = userContext?.firstName
    ? `The user's Telegram name is "${userContext.firstName}${userContext.lastName ? ` ${userContext.lastName}` : ""}"${userContext.username ? ` (@${userContext.username})` : ""}.`
    : "";

  return `You are the official AI Qualifier bot for Samarth Nimangre (brand: SAM CODES), running 24/7 on Telegram (@samarth_master_bot).

### STRICT CLOSED-DOMAIN GROUNDING INVARIANT (ZERO EXTERNAL KNOWLEDGE)
• You are strictly restricted to the verified facts, services, case studies, pricing, contact links, and calendar slots provided explicitly in this prompt.
• Under NO circumstances should you invent facts, hallucinate URLs, make up pricing, or answer using outside general knowledge about software/services not mentioned here.
• If the user asks a question that cannot be answered directly from the verified facts provided below, politely explain:
  "I can only answer verified questions regarding Samarth's engineering portfolio, capabilities, and pricing. For specialized inquiries, please contact Samarth directly on Telegram (@Samarth1306) or schedule an architecture call: ${CONTACT_CONFIG.CAL_URL}"
• Never hallucinate calendar slots, phone numbers, email addresses, or external links.

### ABOUT SAMARTH & SAM CODES
• Developer: ${profileData.fullName} (${profileData.title}), based in ${profileData.location}.
• Philosophy: Strict ZERO-FABRICATION policy. Only quote real engineering capabilities, real verified deliverables, and realistic timelines. Never invent capabilities or give false guarantees.
• Verified Payment Pathways:
  - India: Instant UPI transfer to '6361209256@ibl' or NEFT/IMPS
  - International: PayPal, Stripe invoice, or Wise
  - Terms: Micro-fixes (100% upon working demo test). Larger builds (50% deposit / 50% on launch).
• Core Offerings & Pricing Catalog:
${servicesText}

• Verified Production Projects & Case Studies:
${projectsText}

• Verified Contact Pathways:
  - Telegram Bot: ${CONTACT_CONFIG.TELEGRAM_BOT_HANDLE}
  - Direct Telegram: ${CONTACT_CONFIG.TELEGRAM_PERSONAL_HANDLE}
  - WhatsApp Intake: +91 8550816706
  - Primary Email: ${CONTACT_CONFIG.EMAIL_ADDRESS}
  - 15-Minute Architecture Call (Cal.com): ${CONTACT_CONFIG.CAL_URL}
${liveSlotsText}
• Grounded Portfolio Knowledge:
${faqsText}

${userNameHint}

### YOUR CONVERSATIONAL ROLE & BEHAVIOR
1. Persona: Technically sharp, concise, enthusiastic, professional, and builder-focused.
2. If the user asks a question about Samarth, his tech stack, pricing, background, or previous work, answer accurately using the grounded knowledge above.
3. If the user wants to build or automate something, guide the conversation toward defining:
   - What they want built (problem brief & required system)
   - Their target timeline (e.g. ASAP, 2 weeks, end of month)
   - Their best email address or preferred handle for Samarth to follow up with an architectural blueprint
4. Do NOT be pushy. Keep messages concise (usually 2-4 short paragraphs maximum, suitable for Telegram chat). Use emojis tastefullly.
5. When the user has provided enough information (at minimum: a clear project brief and a contact email/handle/telegram ID), set "readyToQualify": true in your JSON output.
6. Cal.com Real-Time Scheduling: When the user asks to schedule a call, meet, or pick a time today/tomorrow:
   - Quote the real available slots provided above in IST.
   - Instruct them to confirm the slot or lock it in directly at ${CONTACT_CONFIG.CAL_URL}.
   - CRITICAL ZERO-HALLUCINATION INVARIANT: NEVER invent or output any other Cal.com URL, username, or duration (e.g. NEVER output cal.com/samarth/30min or any non-existent link). The ONLY authorized booking URL is ${CONTACT_CONFIG.CAL_URL}.

### OUTPUT FORMAT
You MUST reply with a strictly valid JSON object matching this schema:
{
  "replyText": "Your direct message to the user on Telegram. Use Telegram-compatible formatting (bullet points, clean line breaks).",
  "extractedLead": {
    "name": "Stated client name or null",
    "handleOrEmail": "Detected email address, @telegram_handle, or phone number",
    "serviceRequested": "Name of best-fitting service or Custom System Engineering",
    "problemBrief": "Concise summary of their project requirements",
    "timeline": "Stated timeline or null",
    "estimatedScope": "Small | Medium | Large | null"
  },
  "readyToQualify": boolean,
  "suggestedPhase": "INITIAL" | "DISCOVERY" | "QUALIFICATION" | "CONFIRMED"
}
Output ONLY the JSON object. Do not wrap in markdown backticks.`;
}

/**
 * Execute an intelligent agent turn powered by Google Gemini.
 */
export async function executeGeminiTurn(
  session: TelegramSession,
  incomingText: string,
  userContext?: UserContext
): Promise<AgentTurnResult> {
  const startTime = Date.now();
  const apiKey = await resolveGeminiApiKey();

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  // Ensure session has history tracking
  if (!session.history) {
    session.history = [];
  }

  // Append user message to history
  session.history.push({
    role: "user",
    text: incomingText,
  });

  // Limit in-memory history to last 12 turns for token efficiency and speed
  if (session.history.length > 12) {
    session.history = session.history.slice(-12);
  }

  // Format messages for Gemini API
  const messages: GeminiMessage[] = session.history.map((h) => ({
    role: h.role,
    text: h.text,
  }));

  const systemPrompt = await buildSystemPrompt(userContext);

  const rawJsonResponse = await callGeminiApi({
    apiKey,
    systemPrompt,
    messages,
    temperature: 0.15,
    maxOutputTokens: 2048,
    responseJson: true,
    timeoutMs: 14000,
  });

  let parsed: GeminiExtractionResponse;
  try {
    // Strip markdown code fences if model accidentally emitted them
    const sanitized = rawJsonResponse.replace(/```(?:json)?/g, "").trim();
    parsed = JSON.parse(sanitized) as GeminiExtractionResponse;
  } catch (err) {
    // Resilient fallback: attempt extraction of replyText if JSON was slightly truncated
    const replyMatch = rawJsonResponse.match(/"replyText"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (replyMatch && replyMatch[1]) {
      const decodedReply = replyMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
      parsed = {
        replyText: decodedReply,
        suggestedPhase: session.phase,
      };
    } else {
      console.error("[Gemini Agent] Failed to parse JSON response:", rawJsonResponse, err);
      throw new Error("Gemini returned invalid JSON format.");
    }
  }

  // 1. Merge extracted lead details from Gemini
  if (parsed.extractedLead) {
    const ext = parsed.extractedLead;
    if (ext.name && !session.leadDraft.name) session.leadDraft.name = ext.name;
    if (ext.handleOrEmail) session.leadDraft.handleOrEmail = ext.handleOrEmail;
    if (ext.serviceRequested) session.leadDraft.serviceRequested = ext.serviceRequested;
    if (ext.problemBrief) session.leadDraft.problemBrief = ext.problemBrief;
    if (ext.timeline) session.leadDraft.timeline = ext.timeline;
    if (ext.estimatedScope) session.leadDraft.estimatedScope = ext.estimatedScope;
  }

  // 2. Fallback entity extraction from raw text
  const rxEmail = extractEmail(incomingText);
  const rxHandle = extractHandle(incomingText);
  const rxTimeline = extractTimeline(incomingText);
  const rxName = extractStatedName(incomingText);

  if (rxEmail) session.leadDraft.handleOrEmail = rxEmail;
  else if (rxHandle && !session.leadDraft.handleOrEmail?.includes("@") && !session.leadDraft.handleOrEmail?.includes(".")) {
    session.leadDraft.handleOrEmail = rxHandle;
  }
  if (rxTimeline) session.leadDraft.timeline = rxTimeline;
  if (rxName && !session.leadDraft.name) session.leadDraft.name = rxName;

  if (!session.leadDraft.serviceRequested) {
    const matched = matchService(incomingText);
    session.leadDraft.serviceRequested = matched.title;
  }
  if (!session.leadDraft.problemBrief && incomingText.length > 10) {
    session.leadDraft.problemBrief = incomingText;
  }

  // 3. Multi-turn State Machine Transition
  if (parsed.suggestedPhase && parsed.suggestedPhase !== "INITIAL") {
    session.phase = parsed.suggestedPhase;
  } else if (session.phase === "INITIAL") {
    session.phase = "DISCOVERY";
  }

  if (
    session.leadDraft.serviceRequested &&
    session.phase === "DISCOVERY" &&
    (session.messagesCount >= 2 || incomingText.length > 25)
  ) {
    session.phase = "QUALIFICATION";
  }

  // Check if we have sufficient info to qualify and log an inquiry into Supabase
  let leadQualified = false;
  let inquiryCreated: Inquiry | undefined = undefined;

  const hasBrief = !!(session.leadDraft.problemBrief || incomingText.length > 15);
  const hasContact = !!(
    session.leadDraft.handleOrEmail ||
    session.username ||
    session.chatId
  );

  const shouldLog =
    (parsed.readyToQualify || (hasBrief && session.leadDraft.timeline && hasContact)) &&
    !session.inquiryId;

  if (shouldLog) {
    leadQualified = true;
    const clientName =
      session.leadDraft.name ||
      session.firstName ||
      (session.username ? `@${session.username}` : `Telegram User`);

    const clientContact =
      session.leadDraft.handleOrEmail ||
      (session.username ? `@${session.username}` : `Telegram Chat #${session.chatId}`);

    const isEmail =
      clientContact.includes("@") &&
      !clientContact.startsWith("@") &&
      clientContact.includes(".");

    inquiryCreated = await createInquiry({
      name: clientName,
      email: isEmail ? clientContact : undefined,
      contactMethod: `Telegram (@${session.username || "direct_user"})${session.leadDraft.handleOrEmail ? ` / ${session.leadDraft.handleOrEmail}` : ""}`,
      serviceRequested: session.leadDraft.serviceRequested || "Custom System Engineering",
      message:
        `[TELEGRAM GEMINI AGENT INTAKE]\n` +
        `• Service: ${session.leadDraft.serviceRequested || "Intelligent System Integration"}\n` +
        `• Brief: ${session.leadDraft.problemBrief || incomingText}\n` +
        `• Timeline: ${session.leadDraft.timeline || "As discussed in chat"}\n` +
        `• Scope: ${session.leadDraft.estimatedScope || "Standard"}\n` +
        `• Contact: ${clientContact}\n` +
        `• Telegram Chat ID: ${session.chatId}\n` +
        `• Engine: Google Gemini 3.1 Flash (Autonomous Qualification)`,
    });

    session.inquiryId = inquiryCreated.id;
    session.phase = "CONFIRMED";

    logAuditAction(
      "TELEGRAM_GEMINI_LEAD_CAPTURED",
      "INQUIRY",
      inquiryCreated.id,
      "telegram-gemini-agent",
      {
        chatId: session.chatId,
        service: session.leadDraft.serviceRequested,
        model: "gemini-3.1-flash-lite",
      }
    );

    void notifyAdminOnTelegram({
      id: inquiryCreated.id,
      name: inquiryCreated.name,
      service: inquiryCreated.serviceRequested,
      contact: inquiryCreated.contactMethod,
      brief: session.leadDraft.problemBrief || incomingText,
    });
  }

  // Enforce zero-hallucination URL guard: sanitize any cal.com links
  const safeReplyText = parsed.replyText.replace(
    /https?:\/\/cal\.com\/[a-zA-Z0-9_\-\/]+/gi,
    CONTACT_CONFIG.CAL_URL
  );

  // Append model reply to history
  session.history.push({
    role: "model",
    text: safeReplyText,
  });

  const latencyMs = Date.now() - startTime;

  return {
    replyText: safeReplyText,
    phase: session.phase,
    leadDraft: session.leadDraft,
    leadQualified,
    inquiryCreated,
    latencyMs,
  };
}
