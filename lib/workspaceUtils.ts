import {
  WorkspaceState,
  Workspace,
  Page,
  ContentBlock,
} from "./types";
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

function createWelcomeContent(title: string, now: string): ContentBlock[] {
  return [
    {
      id: generateId("block"),
      type: "heading1",
      content: `Welcome to ${title}!`,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId("block"),
      type: "paragraph",
      content: "Start by creating pages or databases from the sidebar.",
      createdAt: now,
      updatedAt: now,
    },
  ];
}

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

  const welcomePage = createPage(workspaceId, "Welcome", "document");
  welcomePage.position = 0;
  welcomePage.title = "Getting Started";
  welcomePage.icon = "📘";
  welcomePage.content = createWelcomeContent(name, now);

  const tasksPage = createPage(workspaceId, "Tasks", "database");
  tasksPage.position = 1;
  tasksPage.icon = "📋";

  return {
    workspace,
    defaultPageId: welcomePage.id,
    pages: {
      [welcomePage.id]: welcomePage,
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
