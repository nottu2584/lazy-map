-- Create oauth_tokens table for storing OAuth refresh tokens
-- Migration: 20250109000001-create-oauth-tokens-table

-- Create the oauth_tokens table
CREATE TABLE IF NOT EXISTS oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  provider VARCHAR(50) NOT NULL CHECK (provider IN ('google', 'discord')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type VARCHAR(50) DEFAULT 'Bearer',
  expires_at TIMESTAMP NOT NULL,
  scope TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Foreign key constraint
  CONSTRAINT fk_oauth_tokens_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,

  -- Unique constraint: one OAuth token per user per provider
  CONSTRAINT unique_user_provider UNIQUE(user_id, provider)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user_id ON oauth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_expires_at ON oauth_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_provider ON oauth_tokens(provider);

-- Add comments for documentation
COMMENT ON TABLE oauth_tokens IS 'Stores OAuth access and refresh tokens for authenticated users';
COMMENT ON COLUMN oauth_tokens.user_id IS 'Reference to the user who owns this token';
COMMENT ON COLUMN oauth_tokens.provider IS 'OAuth provider name (google, discord)';
COMMENT ON COLUMN oauth_tokens.access_token IS 'OAuth access token (encrypted at application level if encryption is enabled)';
COMMENT ON COLUMN oauth_tokens.refresh_token IS 'OAuth refresh token (encrypted at application level)';
COMMENT ON COLUMN oauth_tokens.expires_at IS 'Timestamp when the access token expires';
