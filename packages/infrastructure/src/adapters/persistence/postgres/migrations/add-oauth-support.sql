-- Migration: Add Google OAuth Support
-- Description: Adds support for OAuth authentication, starting with Google Sign-In

-- Add OAuth-related columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'local',
ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS profile_picture TEXT,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- Add login tracking columns
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;

-- Add suspension tracking columns
ALTER TABLE users
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS suspended_by UUID,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- Make password nullable for OAuth users
ALTER TABLE users
ALTER COLUMN password_hash DROP NOT NULL;

-- Add index for Google ID lookups
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- Add foreign key constraint for suspended_by
ALTER TABLE users
ADD CONSTRAINT fk_suspended_by
FOREIGN KEY (suspended_by)
REFERENCES users(id)
ON DELETE SET NULL;

-- Update existing users to have 'local' auth provider
UPDATE users
SET auth_provider = 'local'
WHERE auth_provider IS NULL;

-- Add comment to document the auth_provider values
COMMENT ON COLUMN users.auth_provider IS 'Authentication provider: local, google, github, discord, microsoft';
COMMENT ON COLUMN users.google_id IS 'Google unique user identifier for OAuth users';
COMMENT ON COLUMN users.profile_picture IS 'URL to user profile picture from OAuth provider';
COMMENT ON COLUMN users.email_verified IS 'Whether the email has been verified by the auth provider';
COMMENT ON COLUMN users.last_login_at IS 'Timestamp of the user''s last successful login';
COMMENT ON COLUMN users.suspended_at IS 'Timestamp when the user was suspended';
COMMENT ON COLUMN users.suspended_by IS 'Admin user ID who suspended this user';
COMMENT ON COLUMN users.suspension_reason IS 'Reason for user suspension';