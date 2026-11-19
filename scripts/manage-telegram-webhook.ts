#!/usr/bin/env node
/**
 * Production Telegram Webhook Manager & Diagnostic Engine
 * For Samarth Nimangre (@samarth_master_bot) / SAM CODES Command Center
 *
 * Capabilities:
 *  - Inspects live Vercel webhook status & secret enforcement
 *  - Verifies Telegram Bot API identity (getMe)
 *  - Inspects Telegram server webhook status (getWebhookInfo)
 *  - Binds live Vercel endpoint via Telegram setWebhook with high-entropy secret token
 *  - Conducts end-to-end simulated webhook payload handshake
 */

const DEFAULT_WEBHOOK_URL = "https://sam-codes.vercel.app/api/telegram/webhook";
const DEFAULT_SEND_URL = "https://sam-codes.vercel.app/api/telegram/send";

interface WebhookInfoResult {
  url: string;
  has_custom_certificate: boolean;
  pending_update_count: number;
  last_error_date?: number;
  last_error_message?: string;
  max_connections?: number;
  allowed_updates?: string[];
  ip_address?: string;
}

interface TelegramUserResult {
  id: number;
  is_bot: boolean;
  first_name: string;
  username?: string;
  can_join_groups?: boolean;
  can_read_all_group_messages?: boolean;
  supports_inline_queries?: boolean;
}

function parseArgs(): {
  action: "status" | "set" | "delete" | "test-vercel";
  token?: string;
  secret?: string;
  url: string;
  dropPending: boolean;
} {
  const args = process.argv.slice(2);
  let action: "status" | "set" | "delete" | "test-vercel" = "status";
  let token = process.env.TELEGRAM_BOT_TOKEN;
  let secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  let url = process.env.TELEGRAM_WEBHOOK_URL || DEFAULT_WEBHOOK_URL;
  let dropPending = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "set" || arg === "--set" || arg === "connect") action = "set";
    else if (arg === "status" || arg === "--status" || arg === "check") action = "status";
    else if (arg === "delete" || arg === "--delete" || arg === "remove") action = "delete";
    else if (arg === "test-vercel" || arg === "--test-vercel") action = "test-vercel";
    else if (arg === "--token" || arg === "-t") {
      token = args[++i];
    } else if (arg === "--secret" || arg === "-s") {
      secret = args[++i];
    } else if (arg === "--url" || arg === "-u") {
      url = args[++i];
    } else if (arg === "--drop-pending") {
      dropPending = true;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  return { action, token, secret, url, dropPending };
}

function printHelp(): void {
  console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║  SAM CODES // Telegram Webhook Connection Manager                ║
╚═══════════════════════════════════════════════════════════════════╝

Usage:
  npx tsx scripts/manage-telegram-webhook.ts [action] [options]

Actions:
  status         Inspect current Vercel & Telegram webhook status (Default)
  set / connect  Register the Vercel webhook with Telegram Bot API
  delete         Delete/unset Telegram webhook (revert to polling)
  test-vercel    Send a synthetic probe to test Vercel secret auth

Options:
  -t, --token <BOT_TOKEN>    Telegram Bot Token (e.g. 123456789:ABC...)
  -s, --secret <SECRET>      Webhook secret token (X-Telegram-Bot-Api-Secret-Token)
  -u, --url <URL>            Webhook URL (default: ${DEFAULT_WEBHOOK_URL})
  --drop-pending             Drop pending Telegram updates when setting webhook
  -h, --help                 Display this help message

Environment Variables:
  TELEGRAM_BOT_TOKEN         Fallback bot token
  TELEGRAM_WEBHOOK_SECRET    Fallback webhook secret
  TELEGRAM_WEBHOOK_URL       Fallback webhook URL
`);
}

async function checkVercelEndpoints(secret?: string, url = DEFAULT_WEBHOOK_URL) {
  console.log("\n🔍 [1/3] Probing Live Vercel Production Endpoints...");

  // 1. Check GET /api/telegram/webhook
  try {
    const t0 = Date.now();
    const res = await fetch(url, { method: "GET" });
    const lat = Date.now() - t0;
    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      console.log(`  ✓ Webhook Route Health:   ONLINE (${res.status} OK in ${lat}ms)`);
      console.log(`    Endpoint:               ${url}`);
      console.log(`    Service:                ${data.service || "Active"}`);
    } else {
      console.log(`  ✗ Webhook Route Health:   HTTP ${res.status} (${lat}ms)`);
    }
  } catch (err) {
    console.log(`  ✗ Webhook Route Health:   Unreachable (${(err as Error).message})`);
  }

  // 2. Check GET /api/telegram/send
  try {
    const res = await fetch(DEFAULT_SEND_URL, { method: "GET" });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      console.log(`  ✓ Vercel Config State:    hasBotToken=${data.hasBotToken}, hasAdminChatId=${data.hasAdminChatId}`);
    }
  } catch {
    // Non-blocking
  }

  // 3. Test Secret Token Enforcement
  console.log("\n🔒 [2/3] Verifying Security Token Enforcement...");
  try {
    // Test without secret header
    const unauthRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    if (unauthRes.status === 401) {
      console.log(`  ✓ Secret Enforcement:     ACTIVE (Properly rejected unauthorized POST with HTTP 401)`);
    } else if (unauthRes.status === 200) {
      console.log(`  ⚠ Secret Enforcement:     OPEN (No TELEGRAM_WEBHOOK_SECRET currently set; accepts unauthenticated payloads)`);
    } else {
      console.log(`  ℹ Secret Enforcement:     HTTP ${unauthRes.status}`);
    }

    // Test with secret if provided
    if (secret) {
      const authRes = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Telegram-Bot-Api-Secret-Token": secret,
        },
        body: JSON.stringify({
          update_id: 999999999,
          // Synthetic non-actionable message to trigger clean 200 skipped response
        }),
      });

      const authData = await authRes.json().catch(() => ({}));
      if (authRes.status === 200 && authData.ok) {
        console.log(`  ✓ Provided Secret:        VALID & ACCEPTED by Vercel!`);
      } else if (authRes.status === 401) {
        console.log(`  ✗ Provided Secret:        MISMATCH (Vercel rejected this secret with HTTP 401)`);
      } else {
        console.log(`  ℹ Provided Secret Check:  HTTP ${authRes.status} ->`, authData);
      }
    }
  } catch (err) {
    console.log(`  ✗ Verification Error:     ${(err as Error).message}`);
  }
}

async function checkTelegramBot(token: string) {
  console.log("\n🤖 [3/3] Inspecting Telegram Bot API Registration...");

  // 1. Get Me
  try {
    const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const meData = (await meRes.json()) as { ok: boolean; result?: TelegramUserResult; description?: string };

    if (!meData.ok || !meData.result) {
      console.log(`  ✗ Bot Verification:       FAILED - ${meData.description || "Invalid Bot Token"}`);
      return false;
    }

    const bot = meData.result;
    console.log(`  ✓ Bot Identity:           @${bot.username} ("${bot.first_name}", ID: ${bot.id})`);
    console.log(`    Bot URL:                https://t.me/${bot.username}`);
  } catch (err) {
    console.log(`  ✗ Bot Verification:       Unreachable (${(err as Error).message})`);
    return false;
  }

  // 2. Get Webhook Info
  try {
    const whRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    const whData = (await whRes.json()) as { ok: boolean; result?: WebhookInfoResult; description?: string };

    if (!whData.ok || !whData.result) {
      console.log(`  ✗ Webhook Info:           ${whData.description || "Failed to fetch"}`);
      return false;
    }

    const info = whData.result;
    console.log(`\n  📡 Telegram Server Webhook Registration:`);
    console.log(`    Registered URL:         ${info.url || "(None - Polling Mode)"}`);
    console.log(`    Pending Updates:        ${info.pending_update_count}`);
    console.log(`    Custom Certificate:     ${info.has_custom_certificate ? "Yes" : "No"}`);
    if (info.last_error_date) {
      const errDate = new Date(info.last_error_date * 1000).toISOString();
      console.log(`    Last Error Date:        ${errDate}`);
      console.log(`    Last Error Message:     ${info.last_error_message || "None"}`);
    } else {
      console.log(`    Last Error:             None (Healthy)`);
    }

    if (info.url === DEFAULT_WEBHOOK_URL) {
      console.log(`\n  ✨ PERFECT MATCH: Telegram is actively streaming updates to your Vercel deployment!`);
    } else if (!info.url) {
      console.log(`\n  ⚠️ ACTION NEEDED: Webhook is NOT registered on Telegram yet. Run with 'set' to connect.`);
    } else {
      console.log(`\n  ℹ Different URL set on Telegram: ${info.url}`);
    }

    return true;
  } catch (err) {
    console.log(`  ✗ Webhook Info Error:     ${(err as Error).message}`);
    return false;
  }
}

async function setTelegramWebhook(token: string, url: string, secret?: string, dropPending = false) {
  console.log(`\n🚀 Registering Webhook with Telegram Bot API...`);
  console.log(`   Target URL:              ${url}`);
  if (secret) {
    console.log(`   Secret Token Header:     Attached (X-Telegram-Bot-Api-Secret-Token)`);
  }

  const payload: Record<string, unknown> = {
    url,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: dropPending,
  };

  if (secret) {
    payload.secret_token = secret;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await res.json()) as { ok: boolean; description?: string };

    if (data.ok) {
      console.log(`\n  ✅ SUCCESS! Telegram Webhook Connected:`);
      console.log(`     Description: ${data.description || "Webhook was set"}`);
      console.log(`     Incoming messages to your bot will now instantly trigger:`);
      console.log(`     -> ${url}`);
      return true;
    } else {
      console.log(`\n  ❌ FAILED to set webhook on Telegram:`);
      console.log(`     Description: ${data.description || "Unknown error"}`);
      return false;
    }
  } catch (err) {
    console.log(`\n  ❌ Network Error: ${(err as Error).message}`);
    return false;
  }
}

async function deleteTelegramWebhook(token: string) {
  console.log(`\n🗑️ Unsetting Telegram Webhook...`);
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ drop_pending_updates: false }),
    });

    const data = (await res.json()) as { ok: boolean; description?: string };
    if (data.ok) {
      console.log(`  ✅ Webhook successfully removed from Telegram.`);
    } else {
      console.log(`  ❌ Failed: ${data.description || "Unknown error"}`);
    }
  } catch (err) {
    console.log(`  ❌ Error: ${(err as Error).message}`);
  }
}

async function main() {
  const { action, token, secret, url, dropPending } = parseArgs();

  console.log("===============================================================");
  console.log("       SAM CODES // TELEGRAM WEBHOOK DIAGNOSTIC & BIND        ");
  console.log("===============================================================");

  // Always check Vercel status first
  await checkVercelEndpoints(secret, url);

  if (!token) {
    console.log(`
ℹ️  No Telegram Bot Token provided.
    To inspect Telegram's live registration or connect the webhook:
    Run: npx tsx scripts/manage-telegram-webhook.ts status --token <BOT_TOKEN>
    Or:  npx tsx scripts/manage-telegram-webhook.ts set --token <BOT_TOKEN> --secret <SECRET>
`);
    return;
  }

  if (action === "set") {
    const ok = await setTelegramWebhook(token, url, secret, dropPending);
    if (ok) {
      await checkTelegramBot(token);
    }
  } else if (action === "delete") {
    await deleteTelegramWebhook(token);
  } else {
    await checkTelegramBot(token);
  }

  console.log("\n===============================================================\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
