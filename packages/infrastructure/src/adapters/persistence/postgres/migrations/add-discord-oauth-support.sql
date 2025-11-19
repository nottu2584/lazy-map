-- Migration: Add Discord OAuth Support
-- Description: Adds support for Discord OAuth authentication

-- Add Discord OAuth column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS discord_id VARCHAR(255) UNIQUE;

-- Add index for Discord ID lookups
CREATE INDEX IF NOT EXISTS idx_users_discord_id ON users(discord_id);

-- Add comment to document the discord_id column
COMMENT ON COLUMN users.discord_id IS 'Discord unique user identifier (snowflake ID) for OAuth users';
