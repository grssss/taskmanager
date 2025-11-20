-- Migration: Optimize RLS policies to avoid re-evaluating auth.uid() for each row
-- Created: 2025-11-20
-- Description: Creates helper function to cache auth.uid() result and updates all RLS policies

-- ============================================================================
-- HELPER FUNCTION: Get current user ID (cached per query)
-- ============================================================================
-- This function is marked as STABLE so PostgreSQL can optimize it and avoid
-- re-evaluating it for each row in the same query.

CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS uuid
SET search_path = public, pg_temp
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT auth.uid();
$$;

-- ============================================================================
-- OPTIMIZE user_data RLS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can read own data" ON user_data;
CREATE POLICY "Users can read own data"
  ON user_data
  FOR SELECT
  USING (public.current_user_id() = user_id);

DROP POLICY IF EXISTS "Users can insert own data" ON user_data;
CREATE POLICY "Users can insert own data"
  ON user_data
  FOR INSERT
  WITH CHECK (public.current_user_id() = user_id);

DROP POLICY IF EXISTS "Users can update own data" ON user_data;
CREATE POLICY "Users can update own data"
  ON user_data
  FOR UPDATE
  USING (public.current_user_id() = user_id)
  WITH CHECK (public.current_user_id() = user_id);

DROP POLICY IF EXISTS "Users can delete own data" ON user_data;
CREATE POLICY "Users can delete own data"
  ON user_data
  FOR DELETE
  USING (public.current_user_id() = user_id);

-- ============================================================================
-- OPTIMIZE workspaces RLS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own workspaces" ON workspaces;
CREATE POLICY "Users can view own workspaces"
  ON workspaces FOR SELECT
  USING (public.current_user_id() = user_id);

DROP POLICY IF EXISTS "Users can insert own workspaces" ON workspaces;
CREATE POLICY "Users can insert own workspaces"
  ON workspaces FOR INSERT
  WITH CHECK (public.current_user_id() = user_id);

DROP POLICY IF EXISTS "Users can update own workspaces" ON workspaces;
CREATE POLICY "Users can update own workspaces"
  ON workspaces FOR UPDATE
  USING (public.current_user_id() = user_id)
  WITH CHECK (public.current_user_id() = user_id);

DROP POLICY IF EXISTS "Users can delete own workspaces" ON workspaces;
CREATE POLICY "Users can delete own workspaces"
  ON workspaces FOR DELETE
  USING (public.current_user_id() = user_id);

-- ============================================================================
-- OPTIMIZE pages RLS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own pages" ON pages;
CREATE POLICY "Users can view own pages"
  ON pages FOR SELECT
  USING (public.current_user_id() = user_id);

DROP POLICY IF EXISTS "Users can insert own pages" ON pages;
CREATE POLICY "Users can insert own pages"
  ON pages FOR INSERT
  WITH CHECK (public.current_user_id() = user_id);

DROP POLICY IF EXISTS "Users can update own pages" ON pages;
CREATE POLICY "Users can update own pages"
  ON pages FOR UPDATE
  USING (public.current_user_id() = user_id)
  WITH CHECK (public.current_user_id() = user_id);

DROP POLICY IF EXISTS "Users can delete own pages" ON pages;
CREATE POLICY "Users can delete own pages"
  ON pages FOR DELETE
  USING (public.current_user_id() = user_id);

-- ============================================================================
-- OPTIMIZE page_links RLS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own page links" ON page_links;
CREATE POLICY "Users can view own page links"
  ON page_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pages
      WHERE pages.id = page_links.from_page_id
      AND pages.user_id = public.current_user_id()
    )
  );

DROP POLICY IF EXISTS "Users can insert own page links" ON page_links;
CREATE POLICY "Users can insert own page links"
  ON page_links FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pages
      WHERE pages.id = page_links.from_page_id
      AND pages.user_id = public.current_user_id()
    )
  );

DROP POLICY IF EXISTS "Users can delete own page links" ON page_links;
CREATE POLICY "Users can delete own page links"
  ON page_links FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM pages
      WHERE pages.id = page_links.from_page_id
      AND pages.user_id = public.current_user_id()
    )
  );

