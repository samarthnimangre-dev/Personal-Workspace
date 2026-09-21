/**
 * LinkedIn API v2 & OpenID Connect Engine
 * Handles OAuth 2.0 authorization, token storage, profile fetching, and post publishing
 * for Samarth Nimangre (SAM CODES).
 */

import fs from "node:fs";
import path from "node:path";
import { createAdminClient } from "@/lib/supabase/admin";

export interface LinkedInTokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  refreshTokenExpiresAt?: number;
  scope: string;
  personUrn: string; // e.g. "urn:li:person:..."
  name: string;
  email?: string;
  picture?: string;
  updatedAt?: string;
}

export interface LinkedInProfileInfo {
  connected: boolean;
  name: string;
  email?: string;
  picture?: string;
  personUrn: string;
  profileUrl: string;
  expiresInDays?: number;
}

export interface LinkedInPostParams {
  text: string;
  url?: string;
  title?: string;
}

export interface LinkedInPostResult {
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
}

const LOCAL_TOKEN_CACHE = path.join(process.cwd(), ".linkedin-tokens.json");
const USER_AGENT = "SAM-CODES-Engine/1.2.0 (by /u/Sam_CodeAI)";

/**
 * Retrieves configured LinkedIn Client ID and Secret from process.env or Supabase site_settings.
 */
export async function getLinkedInAppCredentials(): Promise<{
  clientId: string;
  clientSecret: string;
}> {
  const envId = process.env.LINKEDIN_CLIENT_ID || "";
  const envSecret = process.env.LINKEDIN_CLIENT_SECRET || "";

  if (envId && envSecret) {
    return { clientId: envId, clientSecret: envSecret };
  }

  // Fallback to Supabase site_settings
  try {
    const supabase = createAdminClient();
    if (supabase) {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "linkedin_app_credentials")
        .maybeSingle();

      if (data?.value && typeof data.value === "object") {
        const creds = data.value as { clientId?: string; clientSecret?: string };
        if (creds.clientId && creds.clientSecret) {
          return {
            clientId: creds.clientId,
            clientSecret: creds.clientSecret,
          };
        }
      }
    }
  } catch {
    // Non-blocking
  }

  return { clientId: envId, clientSecret: envSecret };
}

/**
 * Saves LinkedIn App credentials (Client ID & Client Secret) to Supabase site_settings.
 */
export async function saveLinkedInAppCredentials(
  clientId: string,
  clientSecret: string
): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    if (!supabase) return false;

    await supabase.from("site_settings").upsert({
      key: "linkedin_app_credentials",
      value: { clientId, clientSecret },
      description: "LinkedIn Developer App Credentials for OAuth 2.0",
      updated_at: new Date().toISOString(),
      is_public: false,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Loads stored LinkedIn tokens from Supabase or local cache.
 */
export async function loadLinkedInTokens(): Promise<LinkedInTokenData | null> {
  // 1. Supabase site_settings
  try {
    const supabase = createAdminClient();
    if (supabase) {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "linkedin_oauth_tokens")
        .maybeSingle();

      if (data?.value && typeof data.value === "object") {
        const val = data.value as unknown as LinkedInTokenData;
        if (val.accessToken && val.personUrn) return val;
      }
    }
  } catch {
    // Non-blocking fallback
  }

  // 2. Local token cache
  try {
    if (fs.existsSync(LOCAL_TOKEN_CACHE)) {
      const raw = fs.readFileSync(LOCAL_TOKEN_CACHE, "utf8");
      const parsed = JSON.parse(raw) as LinkedInTokenData;
      if (parsed.accessToken && parsed.personUrn) return parsed;
    }
  } catch {
    // Ignored
  }

  return null;
}

/**
 * Persists LinkedIn tokens to Supabase site_settings and local disk.
 */
export async function saveLinkedInTokens(tokens: LinkedInTokenData): Promise<void> {
  // 1. Local disk
  try {
    fs.writeFileSync(LOCAL_TOKEN_CACHE, JSON.stringify(tokens, null, 2), "utf8");
  } catch {
    // Non-blocking
  }

  // 2. Supabase site_settings
  try {
    const supabase = createAdminClient();
    if (supabase) {
      await supabase.from("site_settings").upsert({
        key: "linkedin_oauth_tokens",
        value: tokens as unknown as Record<string, unknown>,
        description: "LinkedIn OAuth 2.0 User Tokens for Samarth Nimangre",
        updated_at: new Date().toISOString(),
        is_public: false,
      });
    }
  } catch (err) {
    console.warn("[LinkedIn Client] Could not persist tokens to Supabase:", err);
  }
}

/**
 * Generates the LinkedIn OAuth 2.0 authorization URL.
 */
export async function getLinkedInAuthUrl(
  redirectUri: string,
  state: string = "sam_codes_linkedin_auth"
): Promise<{ authUrl: string | null; error?: string }> {
  const { clientId } = await getLinkedInAppCredentials();
  if (!clientId) {
    return {
      authUrl: null,
      error: "LinkedIn Client ID is not configured in .env or site settings.",
    };
  }

  const scopes = ["openid", "profile", "email", "w_member_social"].join(" ");

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: scopes,
  });

  return {
    authUrl: `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`,
  };
}

/**
 * Exchanges authorization code for a LinkedIn Access Token and loads user profile.
 */
export async function exchangeLinkedInCode(
  code: string,
  redirectUri: string
): Promise<{ success: boolean; tokens?: LinkedInTokenData; error?: string }> {
  const { clientId, clientSecret } = await getLinkedInAppCredentials();
  if (!clientId || !clientSecret) {
    return { success: false, error: "Missing LinkedIn Client ID or Client Secret" };
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": USER_AGENT,
      },
      body: body.toString(),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const tokenRes = (await res.json()) as {
      access_token?: string;
      expires_in?: number;
      refresh_token?: string;
      refresh_token_expires_in?: number;
      scope?: string;
      error?: string;
      error_description?: string;
    };

    if (!res.ok || !tokenRes.access_token) {
      return {
        success: false,
        error:
          tokenRes.error_description ||
          tokenRes.error ||
          `Token exchange failed (HTTP ${res.status})`,
      };
    }

    // Now fetch userinfo using OpenID Connect endpoint
    const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${tokenRes.access_token}`,
        "User-Agent": USER_AGENT,
      },
    });

    if (!profileRes.ok) {
      return {
        success: false,
        error: `Could not fetch LinkedIn profile (HTTP ${profileRes.status})`,
      };
    }

    const profileData = (await profileRes.json()) as {
      sub: string;
      name?: string;
      email?: string;
      picture?: string;
    };

    const personUrn = `urn:li:person:${profileData.sub}`;
    const expiresIn = tokenRes.expires_in || 5184000; // 60 days default

    const tokens: LinkedInTokenData = {
      accessToken: tokenRes.access_token,
      refreshToken: tokenRes.refresh_token,
      expiresAt: Date.now() + expiresIn * 1000 - 60000,
      scope: tokenRes.scope || "openid profile email w_member_social",
      personUrn,
      name: profileData.name || "Samarth Nimangre",
      email: profileData.email,
      picture: profileData.picture,
      updatedAt: new Date().toISOString(),
    };

    await saveLinkedInTokens(tokens);
    return { success: true, tokens };
  } catch (err) {
    clearTimeout(timeout);
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `LinkedIn token exchange network error: ${msg}` };
  }
}

/**
 * Returns authenticated LinkedIn profile status and active token validity.
 */
export async function getLinkedInProfile(): Promise<LinkedInProfileInfo | null> {
  const tokens = await loadLinkedInTokens();
  if (!tokens || !tokens.accessToken) return null;

  const isExpired = Date.now() >= tokens.expiresAt;
  if (isExpired) {
    return null;
  }

  const remainingDays = Math.max(
    0,
    Math.round((tokens.expiresAt - Date.now()) / (1000 * 60 * 60 * 24))
  );

  return {
    connected: true,
    name: tokens.name,
    email: tokens.email,
    picture: tokens.picture,
    personUrn: tokens.personUrn,
    profileUrl: "https://www.linkedin.com/in/sam-codesai",
    expiresInDays: remainingDays,
  };
}

/**
 * Submits a new UGC post to the authenticated user's personal LinkedIn feed.
 */
export async function submitLinkedInPost(
  params: LinkedInPostParams
): Promise<LinkedInPostResult> {
  const tokens = await loadLinkedInTokens();
  if (!tokens || !tokens.accessToken || !tokens.personUrn) {
    return { success: false, error: "Not authenticated with LinkedIn" };
  }

  if (Date.now() >= tokens.expiresAt) {
    return { success: false, error: "LinkedIn access token has expired. Please re-connect." };
  }

  const text = params.text.trim();
  if (!text) {
    return { success: false, error: "Post text is required" };
  }

  const payload: Record<string, unknown> = {
    author: tokens.personUrn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: {
          text,
        },
        shareMediaCategory: params.url ? "ARTICLE" : "NONE",
        ...(params.url
          ? {
              media: [
                {
                  status: "READY",
                  originalUrl: params.url,
                  title: {
                    text: params.title || "SAM CODES Update",
                  },
                },
              ],
            }
          : {}),
      },
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
    },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        "X-Restli-Protocol-Version": "2.0.0",
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const json = (await res.json()) as {
      id?: string;
      message?: string;
      serviceErrorCode?: number;
    };

    if (!res.ok || !json.id) {
      return {
        success: false,
        error: json.message || `LinkedIn post failed (HTTP ${res.status})`,
      };
    }

    const updateUrn = json.id; // e.g. "urn:li:share:..."
    const postUrl = `https://www.linkedin.com/feed/update/${encodeURIComponent(updateUrn)}/`;

    return {
      success: true,
      postId: json.id,
      postUrl,
    };
  } catch (err) {
    clearTimeout(timeout);
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `LinkedIn post submit network error: ${msg}` };
  }
}
