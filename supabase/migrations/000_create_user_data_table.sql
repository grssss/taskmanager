-- Migration: Create user_data table for storing AppState
-- Derived from supabase-schema.sql to align managed migrations workflow.

-- Ensure uuid extension exists for deterministic UUID generation.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Base table for per-user application state.
CREATE TABLE IF NOT EXISTS user_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_state JSONB NOT NULL DEFAULT '{"activeProjectId": "project-default", "projects": [{"id": "project-default", "name": "Personal", "board": {"columns": [{"id": "todo", "name": "To Do", "cardIds": []}, {"id": "in-progress", "name": "In Progress", "cardIds": []}, {"id": "done", "name": "Done", "cardIds": []}], "cards": {}, "categories": [{"id": "general", "name": "General", "color": "#64748b"}]}}]}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_data_user_id ON user_data(user_id);

-- Row Level Security
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON user_data
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data"
  ON user_data
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own data"
  ON user_data
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own data"
  ON user_data
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to keep updated_at current on updates.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_data_updated_at
  BEFORE UPDATE ON user_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
