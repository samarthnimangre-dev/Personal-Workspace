-- ==============================================================================
-- SAM CODES // COMMAND CENTER — SECURITY PATCH: SITE_SETTINGS PRIVACY
-- Migration: 20260921_patch_security_settings.sql
-- Target: Supabase / PostgreSQL 17
-- ==============================================================================

-- 1. Change default value of is_public in site_settings to FALSE (secure by default)
ALTER TABLE site_settings ALTER COLUMN is_public SET DEFAULT false;

-- 2. Retroactively mark all credential and session keys as strictly private (is_public = false)
UPDATE site_settings
SET is_public = false
WHERE key IN (
  'whatsapp_auth_state',
  'twitter_oauth2_tokens',
  'reddit_oauth_tokens',
  'linkedin_app_credentials',
  'linkedin_oauth_tokens',
  'gemini_config',
  'telegram_config'
) OR key LIKE 'twitter_pkce_%';

-- 3. Ensure public whitelist keys remain visible if intended
UPDATE site_settings
SET is_public = true
WHERE key IN (
  'site_title',
  'meta_description',
  'availability_status',
  'global_settings'
);

-- 4. Re-enforce Row Level Security SELECT policy
DROP POLICY IF EXISTS "Public can view public site settings" ON site_settings;

CREATE POLICY "Public can view public site settings" ON site_settings
  FOR SELECT USING (is_public = true);
