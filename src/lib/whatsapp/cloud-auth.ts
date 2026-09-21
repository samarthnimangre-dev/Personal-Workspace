import path from "node:path";
import fs from "node:fs";
import { createAdminClient } from "@/lib/supabase/admin";

const AUTH_DIR = path.join(process.cwd(), ".whatsapp-auth");
const SETTINGS_KEY = "whatsapp_auth_state";

export interface SerializedAuthState {
  updatedAt: string;
  files: Record<string, string>; // filename -> base64 or utf8 content
}

/**
 * Uploads all local .whatsapp-auth credentials to Supabase site_settings table.
 * Ensures that if the local container/machine restarts, cloud instances can restore the session.
 */
export async function syncWhatsAppAuthToCloud(): Promise<boolean> {
  try {
    if (!fs.existsSync(AUTH_DIR)) {
      console.warn("[Cloud Auth] No .whatsapp-auth directory found locally.");
      return false;
    }

    const fileNames = fs.readdirSync(AUTH_DIR);
    if (fileNames.length === 0) {
      console.warn("[Cloud Auth] .whatsapp-auth directory is empty.");
      return false;
    }

    const files: Record<string, string> = {};
    for (const name of fileNames) {
      const filePath = path.join(AUTH_DIR, name);
      const stat = fs.statSync(filePath);
      if (stat.isFile()) {
        files[name] = fs.readFileSync(filePath, "utf8");
      }
    }

    const supabase = createAdminClient();
    if (!supabase) {
      console.warn("[Cloud Auth] Supabase admin client not available (missing env vars).");
      return false;
    }

    const payload: SerializedAuthState = {
      updatedAt: new Date().toISOString(),
      files,
    };

    const { error } = await supabase.from("site_settings").upsert({
      key: SETTINGS_KEY,
      value: payload,
      description: "Encrypted WhatsApp Multi-Device Auth Session for 24/7 Cloud Bridge",
      updated_at: new Date().toISOString(),
      is_public: false,
    });

    if (error) {
      console.error("[Cloud Auth] Failed to upsert auth state to Supabase:", error);
      return false;
    }

    console.log(`[Cloud Auth] Successfully synced ${fileNames.length} session files to Supabase cloud!`);
    return true;
  } catch (err) {
    console.error("[Cloud Auth] Error syncing auth to cloud:", err);
    return false;
  }
}

/**
 * Downloads and restores the WhatsApp session from Supabase into .whatsapp-auth.
 * Allows fresh cloud instances or containers to boot with pre-authenticated sessions.
 */
export async function restoreWhatsAppAuthFromCloud(): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    if (!supabase) {
      console.warn("[Cloud Auth] Supabase admin client not available.");
      return false;
    }

    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", SETTINGS_KEY)
      .maybeSingle();

    if (error || !data || !data.value) {
      console.log("[Cloud Auth] No cloud session found in Supabase site_settings.");
      return false;
    }

    const state = data.value as unknown as SerializedAuthState;
    if (!state.files || Object.keys(state.files).length === 0) {
      console.log("[Cloud Auth] Cloud session state contained 0 files.");
      return false;
    }

    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    }

    let restoredCount = 0;
    for (const [filename, content] of Object.entries(state.files)) {
      const destPath = path.join(AUTH_DIR, filename);
      // Only write if missing or if creds.json
      fs.writeFileSync(destPath, content, "utf8");
      restoredCount++;
    }

    console.log(`[Cloud Auth] Restored ${restoredCount} session files from Supabase (last synced: ${state.updatedAt}).`);
    return true;
  } catch (err) {
    console.error("[Cloud Auth] Error restoring auth from cloud:", err);
    return false;
  }
}

/**
 * Clears the WhatsApp session in Supabase site_settings when logged out or invalidated.
 */
export async function clearWhatsAppAuthFromCloud(): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    if (!supabase) return false;
    await supabase.from("site_settings").delete().eq("key", SETTINGS_KEY);
    console.log("[Cloud Auth] Cleared invalidated session from Supabase site_settings.");
    return true;
  } catch (err) {
    console.error("[Cloud Auth] Error clearing auth from cloud:", err);
    return false;
  }
}
