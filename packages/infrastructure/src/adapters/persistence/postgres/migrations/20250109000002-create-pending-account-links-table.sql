-- Create pending_account_links table for account linking confirmation flow
-- Migration: 20250109000002-create-pending-account-links-table

-- Create the pending_account_links table
CREATE TABLE IF NOT EXISTS pending_account_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  provider VARCHAR(50) NOT NULL CHECK (provider IN ('google', 'discord')),
  provider_user_id TEXT NOT NULL,
  provider_email TEXT NOT NULL,
  provider_data JSONB,
  confirmation_token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Foreign key constraint
  CONSTRAINT fk_pending_links_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pending_links_user_id ON pending_account_links(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_links_token ON pending_account_links(confirmation_token);
CREATE INDEX IF NOT EXISTS idx_pending_links_expires_at ON pending_account_links(expires_at);

-- Add comments for documentation
COMMENT ON TABLE pending_account_links IS 'Temporary storage for account link requests awaiting user confirmation';
COMMENT ON COLUMN pending_account_links.user_id IS 'Reference to the user requesting the link';
COMMENT ON COLUMN pending_account_links.provider IS 'OAuth provider to link (google, discord)';
COMMENT ON COLUMN pending_account_links.provider_user_id IS 'User ID from the OAuth provider';
COMMENT ON COLUMN pending_account_links.provider_email IS 'Email from the OAuth provider';
COMMENT ON COLUMN pending_account_links.provider_data IS 'Additional provider data (profile picture, name, etc.) stored as JSON';
COMMENT ON COLUMN pending_account_links.confirmation_token IS 'Unique token used to confirm the link';
COMMENT ON COLUMN pending_account_links.expires_at IS 'Timestamp when this pending link expires (typically 15-30 minutes)';
