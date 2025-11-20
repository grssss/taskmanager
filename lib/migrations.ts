/**
 * Migration utilities for converting between app state versions
 * Handles conversion from legacy AppState (Projects) to new WorkspaceState (Workspaces + Pages)
 */

import {
  AppState,
  WorkspaceState,
  Workspace,
  Page,
  Project,
  isAppState,
  isWorkspaceState,
  defaultWorkspaceState,
  DatabaseConfig,
} from "./types";

function uid() {
  return Math.random().toString(36).slice(2, 11);
}

/**
 * Converts a legacy Project to a Workspace with a root Database Page
 */
export function convertProjectToWorkspace(
  project: Project,
  workspaceOrder: number
): { workspace: Workspace; pages: Record<string, Page> } {
  const now = new Date().toISOString();
  const workspaceId = `workspace-${uid()}`;
  const databasePageId = `page-${uid()}`;

  // Create workspace
  const workspace: Workspace = {
    id: workspaceId,
    name: project.name || "Untitled Workspace",
    icon: "📋",
    createdAt: now,
    updatedAt: now,
  };

  // Create database page with existing board data
  const databaseConfig: DatabaseConfig = {
    boardState: project.board,
    primaryView: "kanban",
  };

  const databasePage: Page = {
    id: databasePageId,
    workspaceId,
    title: `${project.name} Tasks`,
    icon: "✅",
    type: "database",
    position: 0,
    collapsed: false,
    createdAt: now,
    updatedAt: now,
    databaseConfig,
  };

  return {
    workspace,
    pages: {
      [databasePageId]: databasePage,
    },
  };
}

/**
 * Main migration function: AppState → WorkspaceState
 * Now creates ONE workspace with multiple database pages (one per project)
 */
export function migrateAppStateToWorkspaceState(
  appState: AppState
): WorkspaceState {
  const now = new Date().toISOString();
  const workspaceId = `workspace-${uid()}`;
  const allPages: Record<string, Page> = {};

  // Create a single workspace
  const workspace: Workspace = {
    id: workspaceId,
    name: "Personal Workspace",
    icon: "📋",
    createdAt: now,
    updatedAt: now,
  };

  // Create a database page for each project
  const projectIcons = ["✅", "🎯", "💼", "📊", "🚀", "💡", "⭐", "🔥", "📈", "🎨"];
  let activeDatabasePageId: string | undefined;

  appState.projects.forEach((project, index) => {
    const databasePageId = `page-${uid()}`;

    const databaseConfig: DatabaseConfig = {
      boardState: project.board,
      primaryView: "kanban",
    };

    const databasePage: Page = {
      id: databasePageId,
      workspaceId,
      title: project.name || `Project ${index + 1}`,
      icon: projectIcons[index % projectIcons.length],
      type: "database",
      position: index,
      collapsed: false,
      createdAt: now,
      updatedAt: now,
      databaseConfig,
    };

    allPages[databasePageId] = databasePage;

    // Set the active page to the previously active project
    if (project.id === appState.activeProjectId) {
      activeDatabasePageId = databasePageId;
    }
  });

  // If no active page was found, use the first database page
  if (!activeDatabasePageId) {
    activeDatabasePageId = Object.values(allPages).find((p) => p.type === "database")?.id;
  }

  const migratedState: WorkspaceState = {
    activeWorkspaceId: workspace.id,
    activePageId: activeDatabasePageId,
    workspaces: [workspace],
    pages: allPages,
    sidebarCollapsed: false,
  };

  // Validate the migrated state
  console.log('[Migration] Validating migrated state...');
  console.log('[Migration] Projects migrated:', appState.projects.length);
  console.log('[Migration] Pages created:', Object.keys(allPages).length);
  console.log('[Migration] Workspace ID:', workspace.id);
  console.log('[Migration] Active page ID:', activeDatabasePageId);

  // Log each migrated project as a page
  appState.projects.forEach((project, index) => {
    const correspondingPage = Object.values(allPages).find(p => p.title === project.name || p.title === `${project.name} Tasks`);
    console.log(`[Migration] Project "${project.name}" -> Page:`, correspondingPage ? {
      id: correspondingPage.id,
      title: correspondingPage.title,
      workspaceId: correspondingPage.workspaceId,
      type: correspondingPage.type,
      position: correspondingPage.position
    } : 'NOT FOUND');
  });

  const validation = validateWorkspaceState(migratedState);
  if (!validation.valid) {
    console.error('[Migration] Validation failed:', validation.errors);
  } else {
    console.log('[Migration] Validation passed ✓');
  }

  return migratedState;
}

/**
 * Validates that a WorkspaceState is well-formed
 */
export function validateWorkspaceState(state: WorkspaceState): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check required fields
  if (!state.activeWorkspaceId) {
    errors.push("Missing activeWorkspaceId");
  }

  if (!Array.isArray(state.workspaces)) {
    errors.push("workspaces must be an array");
  }

  if (!state.pages || typeof state.pages !== "object") {
    errors.push("pages must be an object");
  }

  // Check workspace exists
  const workspaceExists = state.workspaces.some(
    (w) => w.id === state.activeWorkspaceId
  );
  if (!workspaceExists && state.workspaces.length > 0) {
    errors.push(`Active workspace ${state.activeWorkspaceId} not found`);
  }

  // Check page integrity
  Object.values(state.pages).forEach((page) => {
    // Check workspace reference
    const pageWorkspaceExists = state.workspaces.some(
      (w) => w.id === page.workspaceId
    );
    if (!pageWorkspaceExists) {
      errors.push(
        `Page ${page.id} references non-existent workspace ${page.workspaceId}`
      );
    }

    // Check parent reference
    if (page.parentPageId && !state.pages[page.parentPageId]) {
      errors.push(
        `Page ${page.id} references non-existent parent ${page.parentPageId}`
      );
    }

    // Check type-specific requirements
    if (page.type === "database" && !page.databaseConfig) {
      errors.push(`Database page ${page.id} missing databaseConfig`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Detects the state type and performs migration if needed
 */
export function ensureWorkspaceState(
  state: unknown
): { state: WorkspaceState; migrated: boolean } {
  // Already WorkspaceState
  if (isWorkspaceState(state)) {
    const validation = validateWorkspaceState(state);
    if (validation.valid) {
      return { state, migrated: false };
    }
    console.warn("Invalid WorkspaceState, using default:", validation.errors);
    return { state: defaultWorkspaceState(), migrated: false };
  }

  // Legacy AppState - migrate it
  if (isAppState(state)) {
    console.log("Migrating AppState to WorkspaceState...");
    const migratedState = migrateAppStateToWorkspaceState(state);
    const validation = validateWorkspaceState(migratedState);

    if (!validation.valid) {
      console.error("Migration produced invalid state:", validation.errors);
      return { state: defaultWorkspaceState(), migrated: true };
    }

    console.log("Migration successful!");
    return { state: migratedState, migrated: true };
  }

  // Unknown format - use default
  console.warn("Unknown state format, using default");
  return { state: defaultWorkspaceState(), migrated: false };
}

/**
 * Creates a backup of the current state before migration
 */
export function createStateBackup(state: unknown): {
  timestamp: string;
  data: unknown;
  type: "AppState" | "WorkspaceState" | "unknown";
} {
  let type: "AppState" | "WorkspaceState" | "unknown" = "unknown";

  if (isAppState(state)) {
    type = "AppState";
  } else if (isWorkspaceState(state)) {
    type = "WorkspaceState";
  }

  return {
    timestamp: new Date().toISOString(),
    data: JSON.parse(JSON.stringify(state)), // Deep clone
    type,
  };
}
