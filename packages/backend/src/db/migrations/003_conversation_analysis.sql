-- Add conversation_analysis column to sessions table
-- Stores Groq transcript analysis separately from PostHog AI analysis (ai_analysis)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS conversation_analysis JSONB;
