-- ==============================================================================
-- TELEFLOW AGENT // TELEGRAM SESSIONS TABLE & INDEXES
-- Target: Supabase / PostgreSQL
-- ==============================================================================

CREATE TABLE IF NOT EXISTS telegram_sessions (
  chat_id TEXT PRIMARY KEY,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  phase TEXT NOT NULL DEFAULT 'INITIAL' CHECK (phase IN ('INITIAL', 'DISCOVERY', 'QUALIFICATION', 'CONFIRMED')),
  messages_count INTEGER NOT NULL DEFAULT 0,
  lead_draft JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for session activity and LRU cleanups
CREATE INDEX IF NOT EXISTS idx_telegram_sessions_last_active ON telegram_sessions(last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_telegram_sessions_phase ON telegram_sessions(phase);

-- Enable Row Level Security
ALTER TABLE telegram_sessions ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
DROP POLICY IF EXISTS "Service role full access to telegram_sessions" ON telegram_sessions;
CREATE POLICY "Service role full access to telegram_sessions"
  ON telegram_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);
