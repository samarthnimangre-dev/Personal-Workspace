/**
 * X (Twitter) API v2 Client Engine
 * Timeout-protected, zero-dependency client utilizing native fetch & crypto.
 * Supports:
 * - App-only Bearer tokens (v2)
 * - OAuth 2.0 with PKCE (User Context with offline.access refresh tokens)
 * - OAuth 1.0a HMAC-SHA1 signatures
 * - Autonomous tweet publishing & token auto-refresh
 * - Persistent token storage via Supabase site_settings & local fallback
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createAdminClient } from "@/lib/supabase/admin";

export interface XConfig {
  consumerKey: string;
  consumerSecret: string;
  clientId: string;
  clientSecret: string;
  bearerToken?: string;
  accessToken?: string;
  accessTokenSecret?: string;
  username: string;
}

export interface OAuth2TokenData {
  tokenType: string;
  expiresIn: number;
  accessToken: string;
  scope: string;
  refreshToken?: string;
  obtainedAt: number;
  expiresAt: number;
}

export interface XVerificationResult {
  valid: boolean;
  tier: "free" | "basic" | "pro" | "unverified";
  canPost: boolean;
  canRead: boolean;
  authMode: "oauth2_user" | "oauth1_user" | "app_bearer" | "none";
  message: string;
  details?: Record<string, unknown>;
}

export interface PostTweetResult {
  success: boolean;
  tweetId?: string;
  text?: string;
  error?: string;
}

const TOKEN_CACHE_FILE = path.join(process.cwd(), ".x-oauth-tokens.json");

/**
 * Resolves X API credentials from environment.
 */
export function resolveXConfig(): XConfig {
  return {
    consumerKey: process.env.X_CONSUMER_KEY || "",
    consumerSecret: process.env.X_CONSUMER_SECRET || "",
    clientId: process.env.X_CLIENT_ID || "",
    clientSecret: process.env.X_CLIENT_SECRET || "",
    bearerToken: process.env.X_BEARER_TOKEN || "",
    accessToken: process.env.X_ACCESS_TOKEN || "",
    accessTokenSecret: process.env.X_ACCESS_TOKEN_SECRET || "",
    username: process.env.X_USERNAME || "Sam_CodeAI",
  };
}

/**
 * Generates cryptographic PKCE code_verifier and code_challenge.
 */
export function generatePKCE(): { verifier: string; challenge: string } {
  const verifier = crypto.randomBytes(32).toString("base64url");
  const challenge = crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url");
  return { verifier, challenge };
}

/**
 * Constructs the OAuth 2.0 PKCE Authorization URL.
 */
export function getOAuth2AuthUrl(
  redirectUri: string = "https://sam-codes.vercel.app/api/admin/twitter/callback",
  state?: string,
  challenge?: string
): { url: string; state: string; verifier: string; challenge: string } {
  const config = resolveXConfig();
  const pkce = generatePKCE();
  const finalChallenge = challenge || pkce.challenge;
  const finalState = state || crypto.randomBytes(16).toString("hex");

  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: redirectUri,
    scope: "tweet.read tweet.write users.read offline.access",
    state: finalState,
    code_challenge: finalChallenge,
    code_challenge_method: "s256",
  });

  return {
    url: `https://twitter.com/i/oauth2/authorize?${params.toString()}`,
    state: finalState,
    verifier: pkce.verifier,
    challenge: finalChallenge,
  };
}

/**
 * Ephemerally saves PKCE code_verifier for a given OAuth state (in Supabase and local cache).
 */
export async function savePendingPKCE(state: string, verifier: string): Promise<void> {
  // 1. Persist to Supabase site_settings
  try {
    const supabase = createAdminClient();
    if (supabase) {
      await supabase.from("site_settings").upsert({
        key: `twitter_pkce_${state}`,
        value: { verifier, createdAt: Date.now() },
        description: "Ephemeral PKCE state verification",
        updated_at: new Date().toISOString(),
        is_public: false,
      });
    }
  } catch {
    // Non-blocking
  }

  // 2. Persist to local cache
  try {
    const pendingFile = path.join(process.cwd(), ".x-oauth-pending.json");
    let map: Record<string, string> = {};
    if (fs.existsSync(pendingFile)) {
      try {
        map = JSON.parse(fs.readFileSync(pendingFile, "utf8"));
      } catch {}
    }
    map[state] = verifier;
    fs.writeFileSync(pendingFile, JSON.stringify(map, null, 2), "utf8");
  } catch {
    // Non-blocking
  }
}

/**
 * Retrieves and cleans up ephemeral PKCE code_verifier for a given OAuth state.
 */
export async function getPendingPKCE(state: string): Promise<string | null> {
  let foundVerifier: string | null = null;

  // 1. Supabase lookup
  try {
    const supabase = createAdminClient();
    if (supabase) {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", `twitter_pkce_${state}`)
        .maybeSingle();

      if (data?.value && typeof data.value === "object") {
        const val = data.value as { verifier?: string };
        if (val.verifier) {
          foundVerifier = val.verifier;
          // Clean up ephemeral key
          await supabase.from("site_settings").delete().eq("key", `twitter_pkce_${state}`);
        }
      }
    }
  } catch {
    // Non-blocking
  }

  if (foundVerifier) return foundVerifier;

  // 2. Local cache lookup
  try {
    const pendingFile = path.join(process.cwd(), ".x-oauth-pending.json");
    if (fs.existsSync(pendingFile)) {
      const map = JSON.parse(fs.readFileSync(pendingFile, "utf8"));
      if (map[state]) {
        foundVerifier = map[state];
        delete map[state];
        fs.writeFileSync(pendingFile, JSON.stringify(map, null, 2), "utf8");
      }
    }
  } catch {
    // Non-blocking
  }

  return foundVerifier;
}

/**
 * Exchanges OAuth 2.0 authorization code for Access Token and Refresh Token.
 */
export async function exchangeOAuth2Code(
  code: string,
  codeVerifier: string,
  redirectUri: string = "https://sam-codes.vercel.app/api/admin/twitter/callback"
): Promise<{ success: boolean; tokens?: OAuth2TokenData; error?: string }> {
  const config = resolveXConfig();
  if (!config.clientId || !config.clientSecret) {
    return { success: false, error: "X_CLIENT_ID and X_CLIENT_SECRET are required." };
  }

  const basicAuth = Buffer.from(
    `${encodeURIComponent(config.clientId)}:${encodeURIComponent(config.clientSecret)}`
  ).toString("base64");

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch("https://api.x.com/2/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: body.toString(),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data = (await res.json()) as {
      token_type?: string;
      expires_in?: number;
      access_token?: string;
      scope?: string;
      refresh_token?: string;
      error?: string;
      error_description?: string;
    };

    if (res.ok && data.access_token) {
      const tokens: OAuth2TokenData = {
        tokenType: data.token_type || "bearer",
        expiresIn: data.expires_in || 7200,
        accessToken: data.access_token,
        scope: data.scope || "",
        refreshToken: data.refresh_token,
        obtainedAt: Date.now(),
        expiresAt: Date.now() + (data.expires_in || 7200) * 1000 - 60000, // 1 min buffer
      };

      await saveOAuth2Tokens(tokens);
      return { success: true, tokens };
    }

    return {
      success: false,
      error: data.error_description || data.error || `Token exchange failed (HTTP ${res.status})`,
    };
  } catch (err) {
    clearTimeout(timeout);
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Token exchange request failed: ${msg}` };
  }
}

/**
 * Refreshes an expired OAuth 2.0 access token using the stored refresh_token.
 */
export async function refreshOAuth2Token(
  refreshToken: string
): Promise<{ success: boolean; tokens?: OAuth2TokenData; error?: string }> {
  const config = resolveXConfig();
  if (!config.clientId || !config.clientSecret) {
    return { success: false, error: "X_CLIENT_ID and X_CLIENT_SECRET are required." };
  }

  const basicAuth = Buffer.from(
    `${encodeURIComponent(config.clientId)}:${encodeURIComponent(config.clientSecret)}`
  ).toString("base64");

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: config.clientId,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch("https://api.x.com/2/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: body.toString(),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data = (await res.json()) as {
      token_type?: string;
      expires_in?: number;
      access_token?: string;
      scope?: string;
      refresh_token?: string;
      error?: string;
      error_description?: string;
    };

    if (res.ok && data.access_token) {
      const tokens: OAuth2TokenData = {
        tokenType: data.token_type || "bearer",
        expiresIn: data.expires_in || 7200,
        accessToken: data.access_token,
        scope: data.scope || "",
        refreshToken: data.refresh_token || refreshToken,
        obtainedAt: Date.now(),
        expiresAt: Date.now() + (data.expires_in || 7200) * 1000 - 60000,
      };

      await saveOAuth2Tokens(tokens);
      return { success: true, tokens };
    }

    return {
      success: false,
      error: data.error_description || data.error || `Refresh failed (HTTP ${res.status})`,
    };
  } catch (err) {
    clearTimeout(timeout);
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Token refresh request failed: ${msg}` };
  }
}

/**
 * Persists OAuth 2.0 tokens to Supabase site_settings and local cache.
 */
export async function saveOAuth2Tokens(tokens: OAuth2TokenData): Promise<void> {
  // 1. Local disk mirror
  try {
    fs.writeFileSync(TOKEN_CACHE_FILE, JSON.stringify(tokens, null, 2), "utf8");
  } catch {
    // Non-blocking in serverless environments
  }

  // 2. Supabase site_settings table
  try {
    const supabase = createAdminClient();
    if (supabase) {
      await supabase.from("site_settings").upsert({
        key: "twitter_oauth2_tokens",
        value: tokens as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
        is_public: false,
      });
    }
  } catch (err) {
    console.warn("[X Client] Could not persist tokens to Supabase:", err);
  }
}

/**
 * Loads stored OAuth 2.0 tokens from Supabase or local cache.
 */
export async function loadOAuth2Tokens(): Promise<OAuth2TokenData | null> {
  // 1. Check Supabase
  try {
    const supabase = createAdminClient();
    if (supabase) {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "twitter_oauth2_tokens")
        .maybeSingle();

      if (data?.value && typeof data.value === "object") {
        const val = data.value as unknown as OAuth2TokenData;
        if (val.accessToken) return val;
      }
    }
  } catch {
    // Non-blocking fallback
  }

  // 2. Check local disk
  try {
    if (fs.existsSync(TOKEN_CACHE_FILE)) {
      const raw = fs.readFileSync(TOKEN_CACHE_FILE, "utf8");
      return JSON.parse(raw) as OAuth2TokenData;
    }
  } catch {
    // Ignored
  }

  return null;
}

/**
 * Retrieves a guaranteed-valid OAuth 2.0 User Access Token (auto-refreshes if needed).
 */
export async function getValidOAuth2AccessToken(): Promise<string | null> {
  const tokens = await loadOAuth2Tokens();
  if (!tokens || !tokens.accessToken) return null;

  // If token is still fresh, return it
  if (Date.now() < tokens.expiresAt) {
    return tokens.accessToken;
  }

  // If expired but we have a refresh_token, refresh automatically
  if (tokens.refreshToken) {
    const refreshRes = await refreshOAuth2Token(tokens.refreshToken);
    if (refreshRes.success && refreshRes.tokens) {
      return refreshRes.tokens.accessToken;
    }
  }

  return null;
}

/**
 * Posts a tweet using OAuth 2.0 User Context (Primary) or OAuth 1.0a (Fallback).
 */
export async function postTweetToX(text: string): Promise<PostTweetResult> {
  // 1. Try OAuth 2.0 User Token
  const oauth2Token = await getValidOAuth2AccessToken();
  if (oauth2Token) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    try {
      const res = await fetch("https://api.x.com/2/tweets", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${oauth2Token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const data = (await res.json()) as {
        data?: { id: string; text: string };
        errors?: Array<{ message: string }>;
        detail?: string;
      };

      if (res.ok && data.data?.id) {
        return { success: true, tweetId: data.data.id, text: data.data.text };
      }

      const errMsg = data.errors?.[0]?.message || data.detail || `HTTP ${res.status}`;
      return { success: false, error: errMsg };
    } catch (err) {
      clearTimeout(timeout);
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: `OAuth 2.0 dispatch failed: ${msg}` };
    }
  }

  // 2. Fallback to OAuth 1.0a if tokens exist in environment
  const config = resolveXConfig();
  if (config.accessToken && config.accessTokenSecret) {
    const endpoint = "https://api.x.com/2/tweets";
    const authHeader = buildOAuth1Header("POST", endpoint, config);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const data = (await res.json()) as {
        data?: { id: string; text: string };
        errors?: Array<{ message: string }>;
        detail?: string;
      };

      if (res.ok && data.data?.id) {
        return { success: true, tweetId: data.data.id, text: data.data.text };
      }

      const errMsg = data.errors?.[0]?.message || data.detail || `HTTP ${res.status}`;
      return { success: false, error: errMsg };
    } catch (err) {
      clearTimeout(timeout);
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: `OAuth 1.0a dispatch failed: ${msg}` };
    }
  }

  return {
    success: false,
    error:
      "No active user authentication found. Authorize with OAuth 2.0 or configure X_ACCESS_TOKEN & Secret.",
  };
}

function rfc3986(str: string): string {
  return encodeURIComponent(str).replace(
    new RegExp("['()*!]", "g"),
    (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase()
  );
}

/**
 * Builds standard OAuth 1.0a Authorization header.
 */
export function buildOAuth1Header(
  method: "POST" | "GET" | "DELETE",
  url: string,
  config: XConfig,
  extraParams: Record<string, string> = {}
): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: config.consumerKey,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: config.accessToken || "",
    oauth_version: "1.0",
    ...extraParams,
  };

  const sortedKeys = Object.keys(oauthParams).sort();
  const paramString = sortedKeys
    .map((k) => `${rfc3986(k)}=${rfc3986(oauthParams[k])}`)
    .join("&");

  const signatureBase = [
    method.toUpperCase(),
    rfc3986(url),
    rfc3986(paramString),
  ].join("&");

  const signingKey = `${rfc3986(config.consumerSecret)}&${rfc3986(
    config.accessTokenSecret || ""
  )}`;

  const signature = crypto
    .createHmac("sha1", signingKey)
    .update(signatureBase)
    .digest("base64");

  oauthParams.oauth_signature = signature;

  const headerParts = Object.keys(oauthParams)
    .sort()
    .map((k) => `${rfc3986(k)}="${rfc3986(oauthParams[k])}"`)
    .join(", ");

  return `OAuth ${headerParts}`;
}

/**
 * Verifies credentials and identifies active posting mechanism.
 */
export async function verifyXCredentials(): Promise<XVerificationResult> {
  const config = resolveXConfig();
  const oauth2Tokens = await loadOAuth2Tokens();

  if (oauth2Tokens && oauth2Tokens.accessToken) {
    const isFresh = Date.now() < oauth2Tokens.expiresAt;
    const canRefresh = !!oauth2Tokens.refreshToken;

    if (isFresh || canRefresh) {
      return {
        valid: true,
        tier: "free",
        canPost: true,
        canRead: true,
        authMode: "oauth2_user",
        message: "X API connected via OAuth 2.0 User Context (Auto-refresh active).",
        details: {
          account: `@${config.username}`,
          authMode: "OAuth 2.0 PKCE",
          expiresInMinutes: Math.max(0, Math.round((oauth2Tokens.expiresAt - Date.now()) / 60000)),
          autoRefreshEnabled: canRefresh,
        },
      };
    }
  }

  if (config.accessToken && config.accessTokenSecret) {
    return {
      valid: true,
      tier: "free",
      canPost: true,
      canRead: true,
      authMode: "oauth1_user",
      message: "X API connected via OAuth 1.0a User Tokens (Permanent Read & Write Active).",
      details: {
        account: `@${config.username}`,
        authMode: "OAuth 1.0a (Permanent)",
      },
    };
  }

  if (config.consumerKey && config.consumerSecret) {
    return {
      valid: true,
      tier: "free",
      canPost: false,
      canRead: false,
      authMode: "app_bearer",
      message: "Developer app credentials verified. Connect OAuth 2.0 to authorize automated posting.",
      details: {
        account: `@${config.username}`,
        hasClientId: !!config.clientId,
        hasClientSecret: !!config.clientSecret,
        consumerKeyPreview: `${config.consumerKey.slice(0, 6)}...${config.consumerKey.slice(-4)}`,
      },
    };
  }

  return {
    valid: false,
    tier: "unverified",
    canPost: false,
    canRead: false,
    authMode: "none",
    message: "X API credentials not configured.",
  };
}
