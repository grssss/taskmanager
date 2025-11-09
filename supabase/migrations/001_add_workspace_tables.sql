-- Migration: Add Workspace and Page tables for Notion-like functionality
-- Created: 2025-11-09
-- Description: Adds workspaces, pages, and page_links tables to support hierarchical page organization

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- WORKSPACES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- Emoji or icon identifier
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_page_id UUID REFERENCES pages(id) ON DELETE CASCADE,

  title TEXT NOT NULL DEFAULT 'Untitled',
  icon TEXT, -- Emoji or icon identifier
  type TEXT NOT NULL CHECK (type IN ('document', 'database')),
  position INTEGER DEFAULT 0, -- For ordering sibling pages
  collapsed BOOLEAN DEFAULT FALSE, -- UI state for sidebar tree

  -- Content varies by type
  content JSONB DEFAULT '[]'::jsonb, -- Array of ContentBlock for document pages
  database_config JSONB, -- DatabaseConfig for database pages

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PAGE_LINKS TABLE (for tracking page relationships)
-- ============================================================================
CREATE TABLE IF NOT EXISTS page_links (
  from_page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  to_page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  block_id TEXT, -- Optional: specific block within page
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (from_page_id, to_page_id, block_id)
);

-- ============================================================================
-- INDEXES for Performance
-- ============================================================================

-- Workspaces
CREATE INDEX IF NOT EXISTS idx_workspaces_user_id ON workspaces(user_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_created_at ON workspaces(created_at DESC);

-- Pages
CREATE INDEX IF NOT EXISTS idx_pages_workspace_id ON pages(workspace_id);
CREATE INDEX IF NOT EXISTS idx_pages_parent_page_id ON pages(parent_page_id);
CREATE INDEX IF NOT EXISTS idx_pages_user_id ON pages(user_id);
CREATE INDEX IF NOT EXISTS idx_pages_type ON pages(type);
CREATE INDEX IF NOT EXISTS idx_pages_position ON pages(workspace_id, parent_page_id, position);
CREATE INDEX IF NOT EXISTS idx_pages_created_at ON pages(created_at DESC);

-- Page Links
CREATE INDEX IF NOT EXISTS idx_page_links_from ON page_links(from_page_id);
CREATE INDEX IF NOT EXISTS idx_page_links_to ON page_links(to_page_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_links ENABLE ROW LEVEL SECURITY;

-- Workspaces policies
DROP POLICY IF EXISTS "Users can view own workspaces" ON workspaces;
CREATE POLICY "Users can view own workspaces"
  ON workspaces FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own workspaces" ON workspaces;
CREATE POLICY "Users can insert own workspaces"
  ON workspaces FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own workspaces" ON workspaces;
CREATE POLICY "Users can update own workspaces"
  ON workspaces FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own workspaces" ON workspaces;
CREATE POLICY "Users can delete own workspaces"
  ON workspaces FOR DELETE
  USING (auth.uid() = user_id);

-- Pages policies
DROP POLICY IF EXISTS "Users can view own pages" ON pages;
CREATE POLICY "Users can view own pages"
  ON pages FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own pages" ON pages;
CREATE POLICY "Users can insert own pages"
  ON pages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own pages" ON pages;
CREATE POLICY "Users can update own pages"
  ON pages FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own pages" ON pages;
CREATE POLICY "Users can delete own pages"
  ON pages FOR DELETE
  USING (auth.uid() = user_id);

-- Page links policies
DROP POLICY IF EXISTS "Users can view own page links" ON page_links;
CREATE POLICY "Users can view own page links"
  ON page_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pages
      WHERE pages.id = page_links.from_page_id
      AND pages.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own page links" ON page_links;
CREATE POLICY "Users can insert own page links"
  ON page_links FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pages
      WHERE pages.id = page_links.from_page_id
      AND pages.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own page links" ON page_links;
CREATE POLICY "Users can delete own page links"
  ON page_links FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM pages
      WHERE pages.id = page_links.from_page_id
      AND pages.user_id = auth.uid()
    )
  );

-- ============================================================================
-- TRIGGERS for automatic updated_at
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for workspaces
DROP TRIGGER IF EXISTS update_workspaces_updated_at ON workspaces;
CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for pages
DROP TRIGGER IF EXISTS update_pages_updated_at ON pages;
CREATE TRIGGER update_pages_updated_at
  BEFORE UPDATE ON pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get all child pages recursively
CREATE OR REPLACE FUNCTION get_child_pages(page_id UUID)
RETURNS TABLE (id UUID, depth INTEGER) AS $$
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
$$ LANGUAGE SQL STABLE;

-- Function to validate page depth (max 10 levels)
CREATE OR REPLACE FUNCTION validate_page_depth()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Trigger to validate page depth
DROP TRIGGER IF EXISTS validate_page_depth_trigger ON pages;
CREATE TRIGGER validate_page_depth_trigger
  BEFORE INSERT OR UPDATE ON pages
  FOR EACH ROW
  EXECUTE FUNCTION validate_page_depth();

-- ============================================================================
-- COMMENTS for Documentation
-- ============================================================================

COMMENT ON TABLE workspaces IS 'Top-level organizational units for users';
COMMENT ON TABLE pages IS 'Pages within workspaces - can be documents or databases';
COMMENT ON TABLE page_links IS 'Tracks links between pages for bi-directional navigation';

COMMENT ON COLUMN pages.type IS 'Page type: document (rich text) or database (kanban/table)';
COMMENT ON COLUMN pages.content IS 'ContentBlock[] array for document pages';
COMMENT ON COLUMN pages.database_config IS 'DatabaseConfig object for database pages (includes BoardState)';
COMMENT ON COLUMN pages.collapsed IS 'UI state: whether page children are collapsed in sidebar';
