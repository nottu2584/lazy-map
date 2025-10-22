-- Migration: Initial Schema
-- Description: Creates the initial database schema for Lazy Map application

-- Create UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  status VARCHAR(50) NOT NULL DEFAULT 'active',

  -- OAuth fields
  auth_provider VARCHAR(50) DEFAULT 'local',
  google_id VARCHAR(255) UNIQUE,
  profile_picture TEXT,
  email_verified BOOLEAN DEFAULT false,

  -- Tracking fields
  last_login_at TIMESTAMP,
  suspended_at TIMESTAMP,
  suspended_by UUID,
  suspension_reason TEXT,

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create maps table
CREATE TABLE IF NOT EXISTS maps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  cell_size INTEGER NOT NULL DEFAULT 32,
  seed VARCHAR(255),

  -- Map data
  tiles JSONB NOT NULL,
  features JSONB,
  metadata JSONB,

  -- Ownership
  author_id UUID,
  is_public BOOLEAN DEFAULT false,

  -- Tags and categorization
  tags TEXT[],
  biome_type VARCHAR(100),

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Foreign key
  CONSTRAINT fk_map_author FOREIGN KEY (author_id)
    REFERENCES users(id) ON DELETE SET NULL
);

-- Create map_history table for tracking user's map generation history
CREATE TABLE IF NOT EXISTS map_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  map_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'created', 'viewed', 'edited', 'deleted', 'exported'
  details JSONB,

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Foreign keys
  CONSTRAINT fk_history_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_history_map FOREIGN KEY (map_id)
    REFERENCES maps(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

CREATE INDEX IF NOT EXISTS idx_maps_author_id ON maps(author_id);
CREATE INDEX IF NOT EXISTS idx_maps_is_public ON maps(is_public);
CREATE INDEX IF NOT EXISTS idx_maps_created_at ON maps(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_maps_tags ON maps USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_maps_biome_type ON maps(biome_type);

CREATE INDEX IF NOT EXISTS idx_map_history_user_id ON map_history(user_id);
CREATE INDEX IF NOT EXISTS idx_map_history_map_id ON map_history(map_id);
CREATE INDEX IF NOT EXISTS idx_map_history_created_at ON map_history(created_at DESC);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maps_updated_at BEFORE UPDATE ON maps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE users IS 'User accounts for authentication and authorization';
COMMENT ON TABLE maps IS 'Generated battle maps with their configuration and tile data';
COMMENT ON TABLE map_history IS 'Tracks user interactions with maps for analytics and history';

COMMENT ON COLUMN users.role IS 'User role: user, premium, admin';
COMMENT ON COLUMN users.status IS 'Account status: active, suspended, pending, deleted';
COMMENT ON COLUMN users.auth_provider IS 'Authentication provider: local, google, github, discord, microsoft';

COMMENT ON COLUMN maps.tiles IS 'JSON array of map tiles with terrain and feature data';
COMMENT ON COLUMN maps.features IS 'JSON object containing generated features like forests, rivers, buildings';
COMMENT ON COLUMN maps.metadata IS 'Additional map metadata like generation settings, version, etc.';
COMMENT ON COLUMN maps.seed IS 'Generation seed for reproducible map creation';

COMMENT ON COLUMN map_history.action IS 'Type of action: created, viewed, edited, deleted, exported';
COMMENT ON COLUMN map_history.details IS 'Additional details about the action in JSON format';