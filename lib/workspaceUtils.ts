import { WorkspaceState, Workspace, Page } from "./types";
import { createPage } from "./pageUtils";

const ICON_FALLBACK = "🗂️";

const isUUIDSupported =
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function";

function generateId(prefix: string) {
  if (isUUIDSupported) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function sanitizeText(value?: string) {
  return value?.trim().slice(0, 120) || "";
}

export type WorkspaceInput = {
  name: string;
  icon?: string;
  description?: string;
};

export type WorkspaceUpdateInput = Partial<WorkspaceInput>;

type WorkspaceTemplate = {
  workspace: Workspace;
  pages: Record<string, Page>;
  defaultPageId: string;
};

function createWorkspaceTemplate(input: WorkspaceInput): WorkspaceTemplate {
  const now = new Date().toISOString();
  const workspaceId = generateId("workspace");
  const name = sanitizeText(input.name) || "New workspace";
  const icon = sanitizeText(input.icon) || ICON_FALLBACK;

  const workspace: Workspace = {
    id: workspaceId,
    name,
    icon,
    description: sanitizeText(input.description) || undefined,
    createdAt: now,
    updatedAt: now,
  };

  const tasksPage = createPage(workspaceId, "Tasks");
  tasksPage.position = 0;
  tasksPage.icon = "📋";

  return {
    workspace,
    defaultPageId: tasksPage.id,
    pages: {
      [tasksPage.id]: tasksPage,
    },
  };
}

export function addWorkspaceToState(
  state: WorkspaceState,
  input: WorkspaceInput
): WorkspaceState {
  const template = createWorkspaceTemplate(input);

  return {
    ...state,
    activeWorkspaceId: template.workspace.id,
    activePageId: template.defaultPageId,
    workspaces: [...state.workspaces, template.workspace],
    pages: {
      ...state.pages,
      ...template.pages,
    },
  };
}

export function updateWorkspaceInState(
  state: WorkspaceState,
  workspaceId: string,
  updates: WorkspaceUpdateInput
): WorkspaceState {
  const name = sanitizeText(updates.name);
  const icon = sanitizeText(updates.icon);
  const description = sanitizeText(updates.description);
  const now = new Date().toISOString();

  return {
    ...state,
    workspaces: state.workspaces.map((workspace) =>
      workspace.id === workspaceId
        ? {
            ...workspace,
            name: name || workspace.name,
            icon: icon || workspace.icon || ICON_FALLBACK,
            description: description || workspace.description,
            updatedAt: now,
          }
        : workspace
    ),
  };
}
