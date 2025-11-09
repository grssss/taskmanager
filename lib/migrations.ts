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
  const rootPageId = `page-${uid()}`;
  const databasePageId = `page-${uid()}`;

  // Create workspace
  const workspace: Workspace = {
    id: workspaceId,
    name: project.name || "Untitled Workspace",
    icon: "📋",
    createdAt: now,
    updatedAt: now,
  };

  // Create a welcome document page (root)
  const rootPage: Page = {
    id: rootPageId,
    workspaceId,
    title: `Welcome to ${workspace.name}`,
    icon: "👋",
    type: "document",
    position: 0,
    collapsed: false,
    createdAt: now,
    updatedAt: now,
    content: [
      {
        id: `block-${uid()}`,
        type: "heading1",
        content: `Welcome to ${workspace.name}!`,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: `block-${uid()}`,
        type: "paragraph",
        content: "Your tasks have been migrated to the database page below.",
        createdAt: now,
        updatedAt: now,
      },
    ],
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
    position: 1,
    collapsed: false,
    createdAt: now,
    updatedAt: now,
    databaseConfig,
  };

  return {
    workspace,
    pages: {
      [rootPageId]: rootPage,
      [databasePageId]: databasePage,
    },
  };
}

/**
 * Main migration function: AppState → WorkspaceState
 */
export function migrateAppStateToWorkspaceState(
  appState: AppState
): WorkspaceState {
  const allPages: Record<string, Page> = {};
  const workspaces: Workspace[] = [];

  // Convert each project to a workspace
  appState.projects.forEach((project, index) => {
    const { workspace, pages } = convertProjectToWorkspace(project, index);
    workspaces.push(workspace);
    Object.assign(allPages, pages);
  });

  // Determine active workspace and page
  const activeProjectIndex = appState.projects.findIndex(
    (p) => p.id === appState.activeProjectId
  );
  const activeWorkspace =
    workspaces[Math.max(0, activeProjectIndex)] || workspaces[0];

  // Find the first database page in the active workspace
  const activeWorkspacePages = Object.values(allPages).filter(
    (p) => p.workspaceId === activeWorkspace?.id
  );
  const activeDatabasePage = activeWorkspacePages.find(
    (p) => p.type === "database"
  );

  return {
    activeWorkspaceId: activeWorkspace?.id || "",
    activePageId: activeDatabasePage?.id,
    workspaces,
    pages: allPages,
    sidebarCollapsed: false,
  };
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
