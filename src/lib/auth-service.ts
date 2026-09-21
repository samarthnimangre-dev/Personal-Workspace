import { cookies } from "next/headers";
import { timingSafeEqual, createHash } from "node:crypto";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { signSessionToken, verifySessionToken } from "@/lib/auth-token";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "super_admin" | "admin";
}

export const DEFAULT_ADMIN_EMAIL = "samarthknimangre@gmail.com";
export const ADMIN_SESSION_COOKIE = "sam_codes_cmd_session";

/**
 * Returns list of authorized admin emails from configuration
 */
export function getAuthorizedAdminEmails(): Set<string> {
  const emails = new Set<string>([
    DEFAULT_ADMIN_EMAIL.toLowerCase(),
    "admin@samcodes.dev",
  ]);

  if (process.env.ADMIN_EMAILS) {
    process.env.ADMIN_EMAILS.split(",").forEach((e) => {
      const clean = e.trim().toLowerCase();
      if (clean) emails.add(clean);
    });
  }

  return emails;
}

/**
 * Checks whether an email is strictly authorized for administrative access
 */
export async function isAuthorizedAdminEmail(email: string): Promise<boolean> {
  const normalized = email.toLowerCase().trim();
  const authorizedSet = getAuthorizedAdminEmails();

  if (authorizedSet.has(normalized)) {
    return true;
  }

  // Check remote admin_users table in Supabase if configured
  try {
    const adminClient = createAdminClient();
    if (adminClient) {
      const { data } = await adminClient
        .from("admin_users")
        .select("email")
        .eq("email", normalized)
        .maybeSingle();

      if (data?.email) {
        return true;
      }
    }
  } catch {
    // If database check fails, fallback to strict static whitelist
  }

  return false;
}

/**
 * Verify if the incoming request has a valid administrative session
 */
export async function verifyAdminSession(): Promise<{ authenticated: boolean; user?: AdminUser }> {
  try {
    // 1. First check Supabase Auth session if present
    const supabase = await createServerSupabase();
    if (supabase) {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (!error && user && user.email) {
        const isAuthorized = await isAuthorizedAdminEmail(user.email);
        if (isAuthorized) {
          return {
            authenticated: true,
            user: {
              id: user.id,
              email: user.email,
              name: user.user_metadata?.full_name || "Samarth Nimangre",
              role: "super_admin",
            },
          };
        }
      }
    }

    // 2. Check signed administrative session cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

    if (!sessionCookie) {
      return { authenticated: false };
    }

    // Verify HMAC-SHA256 signed session token
    const verification = await verifySessionToken(sessionCookie);
    if (verification.valid && verification.payload) {
      const isAuthorized = await isAuthorizedAdminEmail(verification.payload.sub);
      if (isAuthorized) {
        return {
          authenticated: true,
          user: {
            id: `admin-${verification.payload.jti.slice(0, 8)}`,
            email: verification.payload.sub,
            name: "Samarth Nimangre",
            role: verification.payload.role,
          },
        };
      }
    }

    return { authenticated: false };
  } catch (err) {
    console.error("[Auth] Session verification error:", err);
    return { authenticated: false };
  }
}

/**
 * Authenticate administrator with email and password / master secret
 */
export async function authenticateAdmin(
  email: string,
  secretOrPassword: string
): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies();
  const normalizedEmail = email.toLowerCase().trim();

  // Strict email authorization check
  const isAuthorized = await isAuthorizedAdminEmail(normalizedEmail);
  if (!isAuthorized) {
    return { success: false, error: "Access denied. Email is not in the authorized administrative directory." };
  }

  // 1. Try Supabase Auth password first
  const supabase = await createServerSupabase();
  if (supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: secretOrPassword,
    });

    if (!error && data.user) {
      // Also issue session cookie for unified API access
      const token = await signSessionToken(normalizedEmail, "super_admin");
      cookieStore.set(ADMIN_SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: "/",
      });

      return { success: true };
    }
  }

  // 2. Check Master Secret Key
  const masterSecret = process.env.ADMIN_SECRET_KEY;
  if (!masterSecret) {
    return { success: false, error: "Server misconfiguration: ADMIN_SECRET_KEY not set" };
  }
  const hashProvided = createHash("sha256").update(secretOrPassword).digest();
  const hashMaster = createHash("sha256").update(masterSecret).digest();
  const isValidMasterSecret = timingSafeEqual(hashProvided, hashMaster);

  if (isValidMasterSecret) {
    const token = await signSessionToken(normalizedEmail, "super_admin");
    cookieStore.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return { success: true };
  }

  return { success: false, error: "Invalid credentials provided." };
}

/**
 * Terminate administrative session
 */
export async function terminateAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  const supabase = await createServerSupabase();

  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore if Supabase auth is not active
    }
  }

  cookieStore.delete(ADMIN_SESSION_COOKIE);
}
