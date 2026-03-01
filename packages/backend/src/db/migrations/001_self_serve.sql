-- Self-serve free tier migration

-- Add tier and session limit to tenants
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS tier VARCHAR(20) NOT NULL DEFAULT 'free';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS session_limit INTEGER NOT NULL DEFAULT 25;

-- Create usage tracking table
CREATE TABLE IF NOT EXISTS usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  period VARCHAR(7) NOT NULL,
  session_count INTEGER NOT NULL DEFAULT 0,
  voice_minutes INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, period)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_key_prefix ON api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_revoked ON api_keys(revoked_at) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_usage_tenant_period ON usage(tenant_id, period);
CREATE INDEX IF NOT EXISTS idx_sessions_tenant ON sessions(tenant_id);
