import fs from "node:fs";
import path from "node:path";

const TOKEN_FILE = path.join(process.cwd(), ".reddit-tokens.json");
const USER_AGENT = "web:sam-codes:v1.2.0 (by /u/Sam_CodeAI)";

const TITLE = "I built an open-source 385ms Voice AI Receptionist & Telephony Failover Platform with Next.js 16, Cloudflare Workers & ElevenLabs (Live Demo + 87 Tests)";

const POST_BODY = `Hey everyone!

Over the past few weeks, I’ve been engineering **VaniEdge Voice Platform** — an edge-native, zero-downtime telephony engine built to solve the two biggest failure modes of voice AI bots: **awkward 3-5 second dead-air delays** and **silent call drops**.

---

### The Problem with Most AI Voice Setups
1. **The 3-5 Second Lag:** Most bots bounce caller audio through multiple US cloud servers, an external vector DB (Pinecone/Weaviate), an LLM, and a TTS API. In a phone call, 3 seconds of silence feels like a dropped call.
2. **The "Silent Drop" Disaster:** When an upstream speech or LLM endpoint rate-limits or stalls, traditional setups drop the media socket. The caller hears a dead tone or busy signal. For clinics, restaurants, and emergency towing, every dropped call is a lost customer.
3. **Expensive SaaS Vector Lock-in:** Paying $70+/month for managed vector databases just to store clinic hours and menus.

---

### How We Engineered the Solution

1. **Sub-400ms Voice Latency (TTFT: 385ms):**
   - Inbound Twilio PSTN calls hit a globally distributed Cloudflare Worker edge in ~18ms (HMAC-SHA1 signature verified).
   - Upgraded to a bi-directional WebSocket streaming raw 8kHz μ-law audio frames directly to ElevenLabs Conversational AI.
   - VAD turn detection to first audio byte (TTFT) clocks in at **~385ms**.

2. **The Invariant: Zero Dropped Calls (<1,200ms Watchdog):**
   - An edge watchdog supervisor runs a 100ms inspection loop.
   - If an upstream AI connection stalls or silence exceeds 1,200ms, the system instantly clears the playback buffer (<15ms) and executes an atomic Twilio REST call modification (<20ms).
   - The caller hears polite holding audio and is smoothly bridged to a human specialist backup queue — **zero dropped calls, zero redials**.

3. **Embedded SutraDB Vector Memory (<10ms RAG):**
   - Built a zero-dependency hybrid vector database supporting 64-dim dense character n-gram embeddings + BM25 lexical fusion directly on the edge.
   - Retrieves clinic doctor availability or restaurant menus in under 10ms with **$0 external cloud DB cost**.

4. **BridgeView Operations & Cryptographic SMS Dispatch:**
   - Real-time entity extraction extracts caller name, phone number, and service requested.
   - Automatically generates a structured dispatch ticket with an 8-character SHA checksum (e.g. \`VANI-CLI-4A9B\`) and fires an automated SMS confirmation to the caller.

---

### Live Proof & Links to Test
- **Live Next.js 16 Web Studio:** https://vaniedge.vercel.app (test the interactive studio, audited call recording player & failover watchdog)
- **GitHub Repository (MIT):** https://github.com/Sam-CodesAI/VaniEdge-Voice-Platform
- **Live PSTN Dialable Phone Line:** \`+1 (814) 961-3703\` (you can call this number right now to test the live voice agent)
- **Live Health & Telemetry Endpoint:** https://twilio-voice-agent-failover.sam-codes.workers.dev/health
- **Automated Test Coverage:** 87 passing Vitest tests across 11 test suites covering telephony webhooks, signature verification, audio framing, and RAG.

---

I'd love any feedback, code review, or architecture critiques from other telephony, WebRTC, and voice engineers! 

If you are a business owner or agency looking to deploy this for your clients, feel free to reply below or reach me directly on Telegram at [@Samarth1306](https://t.me/Samarth1306).`;

async function getAccessToken(): Promise<string> {
  const raw = fs.readFileSync(TOKEN_FILE, "utf8");
  const data = JSON.parse(raw);
  return data.accessToken;
}

async function submitPost(subreddit: string, token: string) {
  let sr = subreddit.trim();
  if (sr.startsWith("r/")) sr = sr.replace(/^r\//, "");
  if (sr.startsWith("u/")) sr = `u_${sr.replace(/^u\//, "")}`;

  const body = new URLSearchParams({
    api_type: "json",
    sr,
    title: TITLE,
    kind: "self",
    text: POST_BODY,
    resubmit: "true",
    sendreplies: "true",
  });

  const res = await fetch("https://oauth.reddit.com/api/submit", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": USER_AGENT,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const json = (await res.json()) as any;
  const errors = json.json?.errors;
  if (errors && errors.length > 0) {
    return { success: false, error: errors.map((e: any) => e[1] || e[0]).join(", ") };
  }

  if (res.ok && json.json?.data?.url) {
    return { success: true, url: json.json.data.url, id: json.json.data.id };
  }

  return { success: false, error: `HTTP ${res.status}: ${JSON.stringify(json)}` };
}

async function main() {
  const token = await getAccessToken();
  console.log("Using access token for Reddit...");

  // Try r/SideProject
  console.log("\n1. Submitting to r/SideProject...");
  let result = await submitPost("SideProject", token);
  if (result.success && result.url) {
    console.log("🚀 SUCCESS! Post is live on r/SideProject:");
    console.log(result.url);
    return;
  }
  console.log("r/SideProject error:", result.error);

  // Try r/AI_Agents
  console.log("\n2. Submitting to r/AI_Agents...");
  result = await submitPost("AI_Agents", token);
  if (result.success && result.url) {
    console.log("🚀 SUCCESS! Post is live on r/AI_Agents:");
    console.log(result.url);
    return;
  }
  console.log("r/AI_Agents error:", result.error);

  // Try user's personal profile (u/SamarthBuilds_)
  console.log("\n3. Submitting to personal profile (u/SamarthBuilds_)...");
  result = await submitPost("u/SamarthBuilds_", token);
  if (result.success && result.url) {
    console.log("🚀 SUCCESS! Post is live on u/SamarthBuilds_ profile:");
    console.log(result.url);
    return;
  }
  console.log("Profile error:", result.error);
}

main().catch(console.error);
