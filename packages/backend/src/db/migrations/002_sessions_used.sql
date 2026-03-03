-- Add sessions_used counter to tenants for tracking total SDK usage
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS sessions_used INTEGER NOT NULL DEFAULT 0;

-- Backfill from existing usage data (sum all periods)
UPDATE tenants t
SET sessions_used = COALESCE(
  (SELECT SUM(session_count) FROM usage u WHERE u.tenant_id = t.id),
  0
);
