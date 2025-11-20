-- Migration: Fix function search_path security issues
-- Created: 2025-11-20
-- Description: Sets immutable search_path for all functions to prevent search path injection attacks

-- ============================================================================
-- FIX update_updated_at_column() FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = pg_catalog.now();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- FIX get_child_pages() FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_child_pages(page_id UUID)
RETURNS TABLE (id UUID, depth INTEGER)
SET search_path = public, pg_temp
LANGUAGE SQL
STABLE
AS $$
  WITH RECURSIVE page_tree AS (
    -- Base case: direct children
    SELECT
      p.id,
      p.parent_page_id,
      1 AS depth
    FROM pages p
    WHERE p.parent_page_id = page_id

    UNION ALL

    -- Recursive case: children of children
    SELECT
      p.id,
      p.parent_page_id,
      pt.depth + 1
    FROM pages p
    INNER JOIN page_tree pt ON p.parent_page_id = pt.id
    WHERE pt.depth < 20 -- Max depth safety limit
  )
  SELECT id, depth FROM page_tree;
$$;

-- ============================================================================
-- FIX validate_page_depth() FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_page_depth()
RETURNS TRIGGER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  depth INTEGER;
  current_parent_id UUID;
BEGIN
  -- Check if page has a parent
  IF NEW.parent_page_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Count depth
  depth := 0;
  current_parent_id := NEW.parent_page_id;

  WHILE current_parent_id IS NOT NULL AND depth < 20 LOOP
    depth := depth + 1;

    SELECT parent_page_id INTO current_parent_id
    FROM pages
    WHERE id = current_parent_id;
  END LOOP;

  -- Enforce max depth of 10
  IF depth >= 10 THEN
    RAISE EXCEPTION 'Maximum page nesting depth (10) exceeded';
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- FIX has_workspace_state() FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION has_workspace_state(p_user_id UUID)
RETURNS BOOLEAN
SET search_path = public, pg_temp
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_data
    WHERE user_id = p_user_id
    AND workspace_state IS NOT NULL
    AND schema_version >= 2
  );
END;
$$;

-- ============================================================================
-- FIX mark_user_migrated() FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_user_migrated(p_user_id UUID, p_workspace_state JSONB)
RETURNS VOID
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE user_data
  SET
    workspace_state = p_workspace_state,
    schema_version = 2,
    state_backup = app_state, -- Backup old state
    migrated_at = pg_catalog.now()
  WHERE user_id = p_user_id;
END;
$$;

