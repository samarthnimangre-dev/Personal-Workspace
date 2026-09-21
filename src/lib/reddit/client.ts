/**
 * Reddit API v1 OAuth Client Engine
 * Provides persistent authentication, token auto-refresh, and personal account handling
 * for u/SamarthBuilds_ (SAM CODES).
 */

import fs from "node:fs";
import path from "node:path";
import { createAdminClient } from "@/lib/supabase/admin";

export interface RedditTokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tokenType: string;
  scope: string;
  username: string;
  updatedAt?: string;
}

export interface RedditAccountInfo {
  connected: boolean;
  username: string;
  displayName?: string;
  totalKarma: number;
  linkKarma: number;
  commentKarma: number;
  inboxCount: number;
  createdUtc: number;
  iconImg?: string;
  profileUrl: string;
}

export interface RedditPostSummary {
  id: string;
  title: string;
  subreddit: string;
  score: number;
  numComments: number;
  permalink: string;
  url: string;
  createdUtc: number;
}

export interface SubmitPostParams {
  subreddit: string;
  title: string;
  text: string;
  kind?: "self" | "link";
  url?: string;
  flairId?: string;
  flairText?: string;
}

export interface SubmitPostResult {
  success: boolean;
  postId?: string;
  url?: string;
  error?: string;
}

const DEV_CLIENT_ID = process.env.REDDIT_CLIENT_ID || "TWTsqXa53CexlrYGBWaesQ"; // TODO: set REDDIT_CLIENT_ID in env to remove hardcoded fallback
const USER_AGENT = "web:sam-codes:v1.2.0 (by /u/Sam_CodeAI)";
const LOCAL_TOKEN_CACHE = path.join(process.cwd(), ".reddit-tokens.json");
const DEVVIT_TOKEN_FILE = path.join(
  process.env.HOME || "/home/codespace",
  ".devvit",
  "token"
);

/**
 * Loads stored Reddit tokens from Supabase, local cache, or Devvit CLI store.
 */
export async function loadRedditTokens(): Promise<RedditTokenData | null> {
  // 1. Supabase site_settings
  try {
    const supabase = createAdminClient();
    if (supabase) {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "reddit_oauth_tokens")
        .maybeSingle();

      if (data?.value && typeof data.value === "object") {
        const val = data.value as unknown as RedditTokenData;
        if (val.accessToken && val.refreshToken) return val;
      }
    }
  } catch {
    // Non-blocking fallback
  }

  // 2. Local token cache
  try {
    if (fs.existsSync(LOCAL_TOKEN_CACHE)) {
      const raw = fs.readFileSync(LOCAL_TOKEN_CACHE, "utf8");
      const parsed = JSON.parse(raw) as RedditTokenData;
      if (parsed.accessToken) return parsed;
    }
  } catch {
    // Ignored
  }

  // 3. Devvit CLI token file fallback
  try {
    if (fs.existsSync(DEVVIT_TOKEN_FILE)) {
      const raw = JSON.parse(fs.readFileSync(DEVVIT_TOKEN_FILE, "utf8")).token;
      if (raw) {
        const decoded = JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
        const tokens: RedditTokenData = {
          accessToken: decoded.accessToken,
          refreshToken: decoded.refreshToken,
          expiresAt: decoded.expiresAt,
          tokenType: decoded.tokenType || "bearer",
          scope: decoded.scope || "*",
          username: "SamarthBuilds_",
          updatedAt: new Date().toISOString(),
        };
        await saveRedditTokens(tokens);
        return tokens;
      }
    }
  } catch {
    // Ignored
  }

  return null;
}

/**
 * Persists Reddit tokens to Supabase site_settings and local disk.
 */
export async function saveRedditTokens(tokens: RedditTokenData): Promise<void> {
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
        key: "reddit_oauth_tokens",
        value: tokens as unknown as Record<string, unknown>,
        description: "Reddit OAuth 2.0 User Context Tokens for u/SamarthBuilds_",
        updated_at: new Date().toISOString(),
        is_public: false,
      });
    }
  } catch (err) {
    console.warn("[Reddit Client] Could not persist tokens to Supabase:", err);
  }
}

/**
 * Refreshes an expired Reddit access token using the stored refresh_token.
 */
export async function refreshRedditToken(
  refreshToken: string
): Promise<{ success: boolean; tokens?: RedditTokenData; error?: string }> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const basicAuth = Buffer.from(`${DEV_CLIENT_ID}:`).toString("base64");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch("https://www.reddit.com/api/v1/access_token", {
      method: "POST",
      headers: {
        "User-Agent": USER_AGENT,
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data = (await res.json()) as {
      access_token?: string;
      expires_in?: number;
      scope?: string;
      error?: string;
      message?: string;
    };

    if (res.ok && data.access_token) {
      const expiresIn = data.expires_in || 86400;
      const updated: RedditTokenData = {
        accessToken: data.access_token,
        refreshToken,
        expiresAt: Date.now() + expiresIn * 1000 - 60000,
        tokenType: "bearer",
        scope: data.scope || "*",
        username: "SamarthBuilds_",
        updatedAt: new Date().toISOString(),
      };

      await saveRedditTokens(updated);
      return { success: true, tokens: updated };
    }

    return {
      success: false,
      error: data.message || data.error || `Refresh failed (HTTP ${res.status})`,
    };
  } catch (err) {
    clearTimeout(timeout);
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Reddit token refresh request failed: ${msg}` };
  }
}

/**
 * Generates the Reddit OAuth 2.0 authorization URL for u/SamarthBuilds_.
 */
export function getRedditAuthUrl(
  redirectUri: string = "https://sam-codes.vercel.app/api/admin/reddit/callback",
  state: string = "sam_codes_reddit_oauth"
): string {
  const scopes = [
    "identity",
    "submit",
    "read",
    "privatemessages",
    "edit",
    "mysubreddits",
    "history",
  ].join(" ");

  const params = new URLSearchParams({
    client_id: DEV_CLIENT_ID,
    response_type: "code",
    state,
    redirect_uri: redirectUri,
    duration: "permanent",
    scope: scopes,
  });

  return `https://www.reddit.com/api/v1/authorize?${params.toString()}`;
}

/**
 * Exchanges Reddit authorization code for permanent Access & Refresh tokens.
 */
export async function exchangeRedditAuthCode(
  code: string,
  redirectUri: string = "https://sam-codes.vercel.app/api/admin/reddit/callback"
): Promise<{ success: boolean; tokens?: RedditTokenData; error?: string }> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });

  const basicAuth = Buffer.from(`${DEV_CLIENT_ID}:`).toString("base64");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch("https://www.reddit.com/api/v1/access_token", {
      method: "POST",
      headers: {
        "User-Agent": USER_AGENT,
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data = (await res.json()) as {
      access_token?: string;
      expires_in?: number;
      scope?: string;
      refresh_token?: string;
      error?: string;
      message?: string;
    };

    if (res.ok && data.access_token) {
      const expiresIn = data.expires_in || 86400;
      const tokens: RedditTokenData = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || "",
        expiresAt: Date.now() + expiresIn * 1000 - 60000,
        tokenType: "bearer",
        scope: data.scope || "*",
        username: "SamarthBuilds_",
        updatedAt: new Date().toISOString(),
      };

      await saveRedditTokens(tokens);
      return { success: true, tokens };
    }

    return {
      success: false,
      error: data.message || data.error || `Exchange failed (HTTP ${res.status})`,
    };
  } catch (err) {
    clearTimeout(timeout);
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Token exchange request failed: ${msg}` };
  }
}

/**
 * Returns a guaranteed fresh Reddit Access Token (auto-refreshes if needed).
 */
export async function getValidRedditAccessToken(): Promise<string | null> {
  const tokens = await loadRedditTokens();
  if (!tokens || !tokens.accessToken) return null;

  // Fresh token
  if (Date.now() < tokens.expiresAt) {
    return tokens.accessToken;
  }

  // Expired token -> auto-refresh
  if (tokens.refreshToken) {
    const refreshRes = await refreshRedditToken(tokens.refreshToken);
    if (refreshRes.success && refreshRes.tokens) {
      return refreshRes.tokens.accessToken;
    }
  }

  return null;
}

/**
 * Retrieves the authenticated Reddit user profile status, karma, and inbox.
 */
export async function getRedditAccountStatus(): Promise<RedditAccountInfo | null> {
  const token = await getValidRedditAccessToken();
  if (!token) return null;

  try {
    const res = await fetch("https://oauth.reddit.com/api/v1/me", {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": USER_AGENT,
      },
    });

    if (!res.ok) return null;

    const data = (await res.json()) as {
      name: string;
      link_karma: number;
      comment_karma: number;
      total_karma?: number;
      inbox_count: number;
      created_utc: number;
      icon_img?: string;
      subreddit?: {
        title?: string;
        display_name_prefixed?: string;
      };
    };

    return {
      connected: true,
      username: data.name,
      displayName: data.subreddit?.title || data.name,
      totalKarma:
        data.total_karma !== undefined
          ? data.total_karma
          : (data.link_karma || 0) + (data.comment_karma || 0),
      linkKarma: data.link_karma || 0,
      commentKarma: data.comment_karma || 0,
      inboxCount: data.inbox_count || 0,
      createdUtc: data.created_utc,
      iconImg: data.icon_img,
      profileUrl: `https://www.reddit.com/user/${data.name}`,
    };
  } catch {
    return null;
  }
}

/**
 * Retrieves recently submitted posts for the authenticated user.
 */
export async function getRedditRecentPosts(
  limit: number = 10,
  targetUsername?: string
): Promise<RedditPostSummary[]> {
  const token = await getValidRedditAccessToken();
  if (!token) return [];

  const username = targetUsername || "SamarthBuilds_";

  try {
    const res = await fetch(
      `https://oauth.reddit.com/user/${username}/submitted?limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "User-Agent": USER_AGENT,
        },
      }
    );

    if (!res.ok) return [];

    const json = (await res.json()) as {
      data?: {
        children?: Array<{
          data: {
            id: string;
            title: string;
            subreddit_name_prefixed: string;
            score: number;
            num_comments: number;
            permalink: string;
            url: string;
            created_utc: number;
          };
        }>;
      };
    };

    const children = json.data?.children || [];
    return children.map((c) => ({
      id: c.data.id,
      title: c.data.title,
      subreddit: c.data.subreddit_name_prefixed,
      score: c.data.score,
      numComments: c.data.num_comments,
      permalink: `https://reddit.com${c.data.permalink}`,
      url: c.data.url,
      createdUtc: c.data.created_utc,
    }));
  } catch {
    return [];
  }
}

/**
 * Submits a post to a subreddit or personal profile.
 */
export async function submitRedditPost(
  params: SubmitPostParams
): Promise<SubmitPostResult> {
  const token = await getValidRedditAccessToken();
  if (!token) {
    return { success: false, error: "Not authenticated with Reddit." };
  }

  // Sanitize target subreddit
  let sr = params.subreddit.trim();
  if (sr.startsWith("r/")) sr = sr.replace(/^r\//, "");
  if (sr.startsWith("u/")) sr = `u_${sr.replace(/^u\//, "")}`;

  const body = new URLSearchParams({
    api_type: "json",
    sr,
    title: params.title.trim(),
    kind: params.kind || "self",
    text: params.text.trim(),
    resubmit: "true",
    sendreplies: "true",
  });

  if (params.url) {
    body.set("url", params.url.trim());
  }

  if (params.flairId) {
    body.set("flair_id", params.flairId.trim());
  }

  if (params.flairText) {
    body.set("flair_text", params.flairText.trim());
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch("https://oauth.reddit.com/api/submit", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": USER_AGENT,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const json = (await res.json()) as {
      json?: {
        errors?: Array<[string, string, string]>;
        data?: {
          id?: string;
          name?: string;
          url?: string;
        };
      };
    };

    const errors = json.json?.errors;
    if (errors && errors.length > 0) {
      const errorMsg = errors.map((e) => e[1] || e[0]).join(", ");
      return { success: false, error: errorMsg };
    }

    if (res.ok && json.json?.data?.url) {
      return {
        success: true,
        postId: json.json.data.id,
        url: json.json.data.url,
      };
    }

    return {
      success: false,
      error: `Submission failed (HTTP ${res.status})`,
    };
  } catch (err) {
    clearTimeout(timeout);
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Reddit submit request failed: ${msg}` };
  }
}

/**
 * Updates the Reddit profile display name (title) for the authenticated user's profile.
 */
export async function updateRedditProfileDisplayName(
  displayName: string,
  publicDescription?: string
): Promise<{ success: boolean; error?: string }> {
  const token = await getValidRedditAccessToken();
  if (!token) return { success: false, error: "Not authenticated with Reddit" };

  try {
    // 1. Fetch current me data to get user's profile subreddit id (t5_...)
    const meRes = await fetch("https://oauth.reddit.com/api/v1/me", {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": USER_AGENT,
      },
    });
    if (!meRes.ok) {
      return { success: false, error: `Failed to fetch profile (HTTP ${meRes.status})` };
    }
    const me = (await meRes.json()) as {
      subreddit?: {
        name?: string;
        public_description?: string;
      };
    };

    const srName = me.subreddit?.name;
    if (!srName) {
      return { success: false, error: "Subreddit profile identifier not found" };
    }

    const desc =
      publicDescription !== undefined
        ? publicDescription
        : me.subreddit?.public_description || "";

    const body = new URLSearchParams({
      api_type: "json",
      sr: srName,
      title: displayName,
      public_description: desc,
      link_type: "any",
      type: "user",
    });

    const updateRes = await fetch("https://oauth.reddit.com/api/site_admin", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": USER_AGENT,
      },
      body: body.toString(),
    });

    const json = (await updateRes.json()) as {
      json?: {
        errors?: Array<[string, string, string]>;
      };
    };

    if (json.json?.errors && json.json.errors.length > 0) {
      return {
        success: false,
        error: json.json.errors.map((e) => e[1] || e[0]).join(", "),
      };
    }

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Failed to update Reddit profile: ${msg}` };
  }
}

/**
 * Post a comment or proposal reply to a Reddit submission or comment.
 */
export async function sendRedditComment(
  thingId: string,
  text: string
): Promise<{ success: boolean; commentId?: string; permalink?: string; error?: string }> {
  const token = await getValidRedditAccessToken();
  if (!token) return { success: false, error: "Not authenticated with Reddit." };

  const id = thingId.startsWith("t3_") || thingId.startsWith("t1_") ? thingId : `t3_${thingId}`;

  const body = new URLSearchParams({
    api_type: "json",
    thing_id: id,
    text: text.trim(),
  });

  try {
    const res = await fetch("https://oauth.reddit.com/api/comment", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": USER_AGENT,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const json = (await res.json()) as {
      json?: {
        errors?: Array<[string, string, string]>;
        data?: {
          things?: Array<{
            data?: {
              id?: string;
              permalink?: string;
            };
          }>;
        };
      };
    };

    if (json.json?.errors && json.json.errors.length > 0) {
      return {
        success: false,
        error: json.json.errors.map((e) => e[1] || e[0]).join(", "),
      };
    }

    const created = json.json?.data?.things?.[0]?.data;
    if (res.ok && created?.id) {
      return {
        success: true,
        commentId: created.id,
        permalink: created.permalink ? `https://reddit.com${created.permalink}` : undefined,
      };
    }

    return { success: false, error: `Comment submission failed (HTTP ${res.status})` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Reddit comment request failed: ${msg}` };
  }
}

/**
 * Sends a private message (DM) to a Reddit user.
 */
export async function sendRedditPrivateMessage(
  to: string,
  subject: string,
  text: string
): Promise<{ success: boolean; error?: string }> {
  const token = await getValidRedditAccessToken();
  if (!token) return { success: false, error: "Not authenticated with Reddit." };

  const cleanTo = to.replace(/^u\//, "").trim();

  const body = new URLSearchParams({
    api_type: "json",
    to: cleanTo,
    subject: subject.trim(),
    text: text.trim(),
  });

  try {
    const res = await fetch("https://oauth.reddit.com/api/compose", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": USER_AGENT,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const json = (await res.json()) as {
      json?: {
        errors?: Array<[string, string, string]>;
      };
    };

    if (json.json?.errors && json.json.errors.length > 0) {
      return {
        success: false,
        error: json.json.errors.map((e) => e[1] || e[0]).join(", "),
      };
    }

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Reddit PM request failed: ${msg}` };
  }
}


