export type Priority = "low" | "medium" | "high" | "critical";

export interface LinkItem {
  label: string;
  url: string;
  checklistItemId?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string; // MIME type
  url: string;
  uploadedAt: string;
}

export interface Card {
  id: string;
  title: string;
  description?: string;
  categoryIds?: string[];
  createdAt: string; // ISO date
  dueDate?: string; // ISO date
  priority: Priority;
  links?: LinkItem[];
  status?: string;
  checklist?: ChecklistItem[];
  files?: FileAttachment[];
}

export interface Column {
  id: string;
  name: string;
  cardIds: string[];
}

export interface Category {
  id: string;
  name: string;
  color?: string;
}

export interface BoardState {
  columns: Column[];
  cards: Record<string, Card>;
  categories: Category[];
}

export interface Project {
  id: string;
  name: string;
  board: BoardState;
}

export interface AppState {
  activeProjectId: string;
  projects: Project[];
}

export const defaultColumns: Column[] = [
  { id: "todo", name: "To Do", cardIds: [] },
  { id: "in-progress", name: "In Progress", cardIds: [] },
  { id: "done", name: "Done", cardIds: [] },
];

export const defaultState = (): BoardState => ({
  columns: defaultColumns.map((column) => ({
    ...column,
    cardIds: [...column.cardIds],
  })),
  cards: {},
  categories: [
    { id: "general", name: "General", color: "#64748b" },
  ],
});

export const defaultAppState = (): AppState => {
  const defaultProjectId = "project-default";
  return {
    activeProjectId: defaultProjectId,
    projects: [
      {
        id: defaultProjectId,
        name: "Personal",
        board: defaultState(),
      },
    ],
  };
};

// ============================================================================
// NEW: Workspace & Page System (Phase 1)
// ============================================================================

// Content block types for document pages
export type ContentBlockType =
  | "paragraph"
  | "heading1"
  | "heading2"
  | "heading3"
  | "bulletList"
  | "numberedList"
  | "todoList"
  | "quote"
  | "divider"
  | "code"
  | "table"
  | "image"
  | "file";

export interface ContentBlock {
  id: string;
  type: ContentBlockType;
  content: string | Record<string, unknown>; // string for text, object for complex blocks
  metadata?: Record<string, unknown>; // Additional data (e.g., language for code, dimensions for image)
  createdAt: string;
  updatedAt: string;
}

// Database configuration for database pages (wraps existing BoardState)
export interface DatabaseConfig {
  boardState: BoardState; // Existing kanban structure
  primaryView: "kanban" | "table"; // Default view
  viewSettings?: {
    kanban?: Record<string, unknown>;
    table?: Record<string, unknown>;
  };
}

// Page types
export type PageType = "document" | "database";

export interface Page {
  id: string;
  workspaceId: string;
  parentPageId?: string; // undefined for root pages
  title: string;
  icon?: string; // Emoji or icon identifier
  type: PageType;
  position: number; // For ordering among siblings
  collapsed: boolean; // For sidebar tree view
  createdAt: string;
  updatedAt: string;

  // Content varies by type
  content?: ContentBlock[]; // For document pages
  databaseConfig?: DatabaseConfig; // For database pages
}

export interface Workspace {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// New app state structure
export interface WorkspaceState {
  activeWorkspaceId: string;
  activePageId?: string; // Currently viewed page
  workspaces: Workspace[];
  pages: Record<string, Page>; // All pages keyed by ID
  sidebarCollapsed?: boolean; // UI state
}

// ============================================================================
// Type Guards & Validators
// ============================================================================

export function isAppState(value: unknown): value is AppState {
  if (!value || typeof value !== "object") return false;
  const maybe = value as AppState;
  return (
    typeof maybe.activeProjectId === "string" &&
    Array.isArray(maybe.projects)
  );
}

export function isWorkspaceState(value: unknown): value is WorkspaceState {
  if (!value || typeof value !== "object") return false;
  const maybe = value as WorkspaceState;
  return (
    typeof maybe.activeWorkspaceId === "string" &&
    Array.isArray(maybe.workspaces) &&
    typeof maybe.pages === "object" &&
    maybe.pages !== null
  );
}

export function isDatabasePage(page: Page): page is Page & { databaseConfig: DatabaseConfig } {
  return page.type === "database" && !!page.databaseConfig;
}

export function isDocumentPage(page: Page): page is Page & { content: ContentBlock[] } {
  return page.type === "document";
}

// ============================================================================
// Helper Functions
// ============================================================================

export function getPageChildren(pages: Record<string, Page>, parentId: string): Page[] {
  return Object.values(pages)
    .filter(page => page.parentPageId === parentId)
    .sort((a, b) => a.position - b.position);
}

export function getPageDepth(pages: Record<string, Page>, pageId: string): number {
  let depth = 0;
  let currentPage = pages[pageId];

  while (currentPage?.parentPageId && depth < 20) { // Max depth safety
    currentPage = pages[currentPage.parentPageId];
    depth++;
  }

  return depth;
}

export function getPagePath(pages: Record<string, Page>, pageId: string): Page[] {
  const path: Page[] = [];
  let currentPage = pages[pageId];

  while (currentPage && path.length < 20) { // Max depth safety
    path.unshift(currentPage);
    if (!currentPage.parentPageId) break;
    currentPage = pages[currentPage.parentPageId];
  }

  return path;
}

export function getRootPages(pages: Record<string, Page>, workspaceId: string): Page[] {
  return Object.values(pages)
    .filter(page => page.workspaceId === workspaceId && !page.parentPageId)
    .sort((a, b) => a.position - b.position);
}

// ============================================================================
// Default State Generators
// ============================================================================

export const defaultWorkspaceState = (): WorkspaceState => {
  const workspaceId = "workspace-default";
  const rootPageId = "page-root";
  const databasePageId = "page-database-default";

  return {
    activeWorkspaceId: workspaceId,
    activePageId: databasePageId,
    workspaces: [
      {
        id: workspaceId,
        name: "Personal",
        icon: "📝",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    pages: {
      [rootPageId]: {
        id: rootPageId,
        workspaceId: workspaceId,
        title: "Getting Started",
        icon: "🏠",
        type: "document",
        position: 0,
        collapsed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        content: [
          {
            id: "block-welcome",
            type: "heading1",
            content: "Welcome to your workspace!",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "block-intro",
            type: "paragraph",
            content: "Start creating pages to organize your notes and databases.",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      },
      [databasePageId]: {
        id: databasePageId,
        workspaceId: workspaceId,
        title: "Task Board",
        icon: "✅",
        type: "database",
        position: 1,
        collapsed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        databaseConfig: {
          boardState: defaultState(),
          primaryView: "kanban",
        },
      },
    },
    sidebarCollapsed: false,
  };
};
