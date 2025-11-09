-- Migration: Update user_data table for workspace state storage
-- Created: 2025-11-09
-- Description: Adds workspace_state column and schema versioning for migration support

-- ============================================================================
-- UPDATE USER_DATA TABLE
-- ============================================================================

-- Add new column for workspace state (new format)
ALTER TABLE user_data
ADD COLUMN IF NOT EXISTS workspace_state JSONB;

-- Add schema version for tracking migrations
ALTER TABLE user_data
ADD COLUMN IF NOT EXISTS schema_version INTEGER DEFAULT 1;

-- Add backup column to preserve old state during migration
ALTER TABLE user_data
ADD COLUMN IF NOT EXISTS state_backup JSONB;

-- Add migration timestamp
ALTER TABLE user_data
ADD COLUMN IF NOT EXISTS migrated_at TIMESTAMP WITH TIME ZONE;

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_data_schema_version ON user_data(schema_version);
CREATE INDEX IF NOT EXISTS idx_user_data_user_id ON user_data(user_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN user_data.workspace_state IS 'WorkspaceState - new format with workspaces and pages';
COMMENT ON COLUMN user_data.data IS 'Legacy AppState - kept for backward compatibility';
COMMENT ON COLUMN user_data.schema_version IS 'Schema version: 1=AppState, 2=WorkspaceState';
COMMENT ON COLUMN user_data.state_backup IS 'Backup of state before migration';
COMMENT ON COLUMN user_data.migrated_at IS 'Timestamp when migration was performed';

-- ============================================================================
-- MIGRATION HELPER FUNCTION
-- ============================================================================

-- Function to check if user has been migrated
CREATE OR REPLACE FUNCTION has_workspace_state(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_data
    WHERE user_id = p_user_id
    AND workspace_state IS NOT NULL
    AND schema_version >= 2
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to mark user as migrated
CREATE OR REPLACE FUNCTION mark_user_migrated(p_user_id UUID, p_workspace_state JSONB)
RETURNS VOID AS $$
BEGIN
  UPDATE user_data
  SET
    workspace_state = p_workspace_state,
    schema_version = 2,
    state_backup = data, -- Backup old state
    migrated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- DATA INTEGRITY CHECK
-- ============================================================================

-- Ensure all existing users have a schema_version
UPDATE user_data
SET schema_version = 1
WHERE schema_version IS NULL;
