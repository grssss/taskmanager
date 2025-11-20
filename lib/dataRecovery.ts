/**
 * Data Recovery and Validation Utilities
 * Helps fix common issues with WorkspaceState data
 */

import {
  WorkspaceState,
  Page,
  isWorkspaceState,
  defaultWorkspaceState,
} from "./types";
import { validateWorkspaceState } from "./migrations";

export interface RecoveryReport {
  success: boolean;
  fixes: string[];
  errors: string[];
  warnings: string[];
}

/**
 * Analyzes WorkspaceState and identifies issues
 */
export function analyzeWorkspaceState(state: WorkspaceState): RecoveryReport {
  const report: RecoveryReport = {
    success: true,
    fixes: [],
    errors: [],
    warnings: [],
  };

  // Check if state is valid WorkspaceState
  if (!isWorkspaceState(state)) {
    report.success = false;
    report.errors.push("Invalid WorkspaceState structure");
    return report;
  }

  // Run validation
  const validation = validateWorkspaceState(state);
  if (!validation.valid) {
    report.errors.push(...validation.errors);
    report.success = false;
  }

  // Check for orphaned pages
  const { activeWorkspaceId, pages } = state;
  const orphanedPages = Object.values(pages).filter(
    (p) => p.workspaceId !== activeWorkspaceId
  );

  if (orphanedPages.length > 0) {
    report.warnings.push(
      `Found ${orphanedPages.length} pages with mismatched workspaceId`
    );
  }

  // Check for pages with invalid parent references
  const invalidParentPages = Object.values(pages).filter(
    (p) => p.parentPageId && !pages[p.parentPageId]
  );

  if (invalidParentPages.length > 0) {
    report.warnings.push(
      `Found ${invalidParentPages.length} pages with invalid parentPageId`
    );
  }

  // Check if there are any root pages
  const rootPages = Object.values(pages).filter(
    (p) => p.workspaceId === activeWorkspaceId && !p.parentPageId
  );

  if (rootPages.length === 0 && Object.keys(pages).length > 0) {
    report.warnings.push("No root pages found - sidebar will be empty!");
  }

  return report;
}

/**
 * Automatically fixes common issues with WorkspaceState
 */
export function autoFixWorkspaceState(state: WorkspaceState): {
  fixed: WorkspaceState;
  report: RecoveryReport;
} {
  const report: RecoveryReport = {
    success: true,
    fixes: [],
    errors: [],
    warnings: [],
  };

  const fixedState = { ...state };
  const { activeWorkspaceId, pages, workspaces } = fixedState;

  // Fix 1: Ensure active workspace exists
  if (!workspaces.find((w) => w.id === activeWorkspaceId)) {
    if (workspaces.length > 0) {
      fixedState.activeWorkspaceId = workspaces[0].id;
      report.fixes.push(`Set activeWorkspaceId to first workspace: ${workspaces[0].name}`);
    } else {
      report.errors.push("No workspaces found!");
      report.success = false;
      return { fixed: defaultWorkspaceState(), report };
    }
  }

  // Fix 2: Fix all pages to use the active workspace
  const fixedPages: Record<string, Page> = {};
  let orphanedCount = 0;
  let invalidParentCount = 0;

  Object.entries(pages).forEach(([id, page]) => {
    const fixedPage = { ...page };

    // Fix workspace ID mismatch
    if (fixedPage.workspaceId !== fixedState.activeWorkspaceId) {
      fixedPage.workspaceId = fixedState.activeWorkspaceId;
      orphanedCount++;
    }

    // Fix invalid parent references
    if (fixedPage.parentPageId && !pages[fixedPage.parentPageId]) {
      fixedPage.parentPageId = undefined;
      invalidParentCount++;
    }

    fixedPages[id] = fixedPage;
  });

  if (orphanedCount > 0) {
    report.fixes.push(`Fixed ${orphanedCount} pages with incorrect workspaceId`);
  }

  if (invalidParentCount > 0) {
    report.fixes.push(`Fixed ${invalidParentCount} pages with invalid parentPageId`);
  }

  fixedState.pages = fixedPages;

  // Fix 3: Ensure active page exists and is valid
  if (fixedState.activePageId) {
    const activePage = fixedPages[fixedState.activePageId];
    if (!activePage) {
      // Active page doesn't exist, pick first root page
      const rootPages = Object.values(fixedPages).filter(
        (p) => p.workspaceId === fixedState.activeWorkspaceId && !p.parentPageId
      );
      if (rootPages.length > 0) {
        fixedState.activePageId = rootPages[0].id;
        report.fixes.push(`Set activePageId to first root page: ${rootPages[0].title}`);
      } else {
        fixedState.activePageId = undefined;
        report.warnings.push("No valid pages found to set as active");
      }
    }
  }

  return { fixed: fixedState, report };
}

/**
 * Force all pages to be root-level pages (no parent)
 * Useful when the hierarchy is broken
 */
export function flattenPageHierarchy(state: WorkspaceState): WorkspaceState {
  const flattenedPages: Record<string, Page> = {};

  Object.entries(state.pages).forEach(([id, page]) => {
    flattenedPages[id] = {
      ...page,
      parentPageId: undefined,
      collapsed: false,
    };
  });

  return {
    ...state,
    pages: flattenedPages,
  };
}

/**
 * Exports current state for backup/debugging
 */
export function exportStateForDebug(state: WorkspaceState): string {
  return JSON.stringify(state, null, 2);
}

/**
 * Tries to recover from a corrupted state
 */
export function recoverFromCorruptedState(
  corruptedState: unknown
): WorkspaceState {
  console.warn("Attempting to recover from corrupted state:", corruptedState);

  // Try to extract any useful data
  if (
    typeof corruptedState === "object" &&
    corruptedState !== null &&
    "pages" in corruptedState &&
    typeof (corruptedState as Record<string, unknown>).pages === "object"
  ) {
    const candidate = corruptedState as {
      pages: Record<string, Page>;
      workspaces?: Array<{ id: string; name: string }>;
    };
    const pages = candidate.pages;
    const workspacesRaw = candidate.workspaces ?? [];
    
    // Map workspaces to include required createdAt and updatedAt properties
    const workspaces = workspacesRaw.map((w) => ({
      ...w,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    if (workspaces.length > 0 && Object.keys(pages).length > 0) {
      const reconstructed: WorkspaceState = {
        activeWorkspaceId: workspaces[0].id,
        activePageId: Object.keys(pages)[0],
        workspaces: workspaces,
        pages: pages,
        sidebarCollapsed: false,
      };

      // Try to auto-fix it
      const { fixed } = autoFixWorkspaceState(reconstructed);
      return fixed;
    }
  }

  // Can't recover, return default
  console.error("Failed to recover state, using default");
  return defaultWorkspaceState();
}
