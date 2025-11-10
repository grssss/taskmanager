/**
 * Page management utilities
 * Handles CRUD operations, tree navigation, and page relationships
 */

import {
  Page,
  WorkspaceState,
  ContentBlock,
  DatabaseConfig,
  getPageChildren,
  getPageDepth,
  getPagePath,
  defaultState,
} from "./types";

function uid() {
  return Math.random().toString(36).slice(2, 11);
}

const MAX_PAGE_DEPTH = 10;

/**
 * Creates a new page
 */
export function createPage(
  workspaceId: string,
  title: string,
  type: "document" | "database",
  parentPageId?: string,
  position?: number
): Page {
  const now = new Date().toISOString();
  const pageId = `page-${uid()}`;

  const basePage: Page = {
    id: pageId,
    workspaceId,
    parentPageId,
    title,
    type,
    position: position ?? 0,
    collapsed: false,
    createdAt: now,
    updatedAt: now,
  };

  if (type === "document") {
    return {
      ...basePage,
      content: [
        {
          id: `block-${uid()}`,
          type: "paragraph",
          content: "",
          createdAt: now,
          updatedAt: now,
        },
      ],
    };
  } else {
    return {
      ...basePage,
      databaseConfig: {
        boardState: defaultState(),
        primaryView: "kanban",
      },
    };
  }
}

/**
 * Adds a new page to the workspace state
 */
export function addPageToState(
  state: WorkspaceState,
  page: Page
): WorkspaceState {
  // Validate depth if it has a parent
  if (page.parentPageId) {
    const depth = getPageDepth({ ...state.pages, [page.id]: page }, page.id);
    if (depth >= MAX_PAGE_DEPTH) {
      throw new Error(`Maximum page nesting depth (${MAX_PAGE_DEPTH}) exceeded`);
    }
  }

  return {
    ...state,
    pages: {
      ...state.pages,
      [page.id]: page,
    },
  };
}

/**
 * Deletes a page and all its children
 */
export function deletePage(
  state: WorkspaceState,
  pageId: string
): WorkspaceState {
  const pagesToDelete = new Set<string>([pageId]);

  // Recursively find all children
  const findChildren = (pid: string) => {
    const children = getPageChildren(state.pages, pid);
    children.forEach((child) => {
      pagesToDelete.add(child.id);
      findChildren(child.id);
    });
  };

  findChildren(pageId);

  // Remove all pages
  const newPages = { ...state.pages };
  pagesToDelete.forEach((id) => {
    delete newPages[id];
  });

  // Update active page if deleted
  let newActivePageId = state.activePageId;
  if (pagesToDelete.has(state.activePageId || "")) {
    // Find another page in the same workspace
    const remainingPages = Object.values(newPages).filter(
      (p) => p.workspaceId === state.activeWorkspaceId
    );
    newActivePageId = remainingPages[0]?.id;
  }

  return {
    ...state,
    pages: newPages,
    activePageId: newActivePageId,
  };
}

/**
 * Updates a page
 */
export function updatePage(
  state: WorkspaceState,
  pageId: string,
  updates: Partial<Omit<Page, "id" | "workspaceId" | "createdAt">>
): WorkspaceState {
  const page = state.pages[pageId];
  if (!page) {
    throw new Error(`Page ${pageId} not found`);
  }

  // Validate depth if parent is changing
  if (updates.parentPageId !== undefined && updates.parentPageId !== page.parentPageId) {
    const updatedPage = { ...page, ...updates, parentPageId: updates.parentPageId };
    const depth = getPageDepth({ ...state.pages, [pageId]: updatedPage }, pageId);
    if (depth >= MAX_PAGE_DEPTH) {
      throw new Error(`Maximum page nesting depth (${MAX_PAGE_DEPTH}) exceeded`);
    }

    // Check for circular reference
    if (updates.parentPageId) {
      const path = getPagePath(state.pages, updates.parentPageId);
      if (path.some((p) => p.id === pageId)) {
        throw new Error("Cannot move page under its own descendant");
      }
    }
  }

  return {
    ...state,
    pages: {
      ...state.pages,
      [pageId]: {
        ...page,
        ...updates,
        updatedAt: new Date().toISOString(),
      },
    },
  };
}

/**
 * Moves a page to a new parent
 */
export function movePageUnder(
  state: WorkspaceState,
  pageId: string,
  newParentPageId: string | undefined,
  newPosition?: number
): WorkspaceState {
  return updatePage(state, pageId, {
    parentPageId: newParentPageId,
    position: newPosition ?? 0,
  });
}

/**
 * Toggles page collapsed state
 */
export function togglePageCollapsed(
  state: WorkspaceState,
  pageId: string
): WorkspaceState {
  const page = state.pages[pageId];
  if (!page) return state;

  return updatePage(state, pageId, {
    collapsed: !page.collapsed,
  });
}

/**
 * Reorders pages among siblings
 */
export function reorderPages(
  state: WorkspaceState,
  pageIds: string[],
  parentPageId?: string
): WorkspaceState {
  const newPages = { ...state.pages };

  pageIds.forEach((pageId, index) => {
    if (newPages[pageId]) {
      newPages[pageId] = {
        ...newPages[pageId],
        position: index,
        parentPageId,
        updatedAt: new Date().toISOString(),
      };
    }
  });

  return {
    ...state,
    pages: newPages,
  };
}

/**
 * Adds a content block to a document page
 */
export function addContentBlock(
  state: WorkspaceState,
  pageId: string,
  block: ContentBlock,
  position?: number
): WorkspaceState {
  const page = state.pages[pageId];
  if (!page || page.type !== "document") {
    throw new Error("Can only add content blocks to document pages");
  }

  const content = page.content || [];
  const newContent = [...content];

  if (position !== undefined && position >= 0 && position <= content.length) {
    newContent.splice(position, 0, block);
  } else {
    newContent.push(block);
  }

  return updatePage(state, pageId, { content: newContent });
}

/**
 * Updates a content block in a document page
 */
export function updateContentBlock(
  state: WorkspaceState,
  pageId: string,
  blockId: string,
  updates: Partial<Omit<ContentBlock, "id" | "createdAt">>
): WorkspaceState {
  const page = state.pages[pageId];
  if (!page || page.type !== "document") {
    throw new Error("Can only update content blocks in document pages");
  }

  const content = page.content || [];
  const blockIndex = content.findIndex((b) => b.id === blockId);
  if (blockIndex === -1) {
    throw new Error(`Block ${blockId} not found`);
  }

  const newContent = [...content];
  newContent[blockIndex] = {
    ...newContent[blockIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  return updatePage(state, pageId, { content: newContent });
}

/**
 * Deletes a content block from a document page
 */
export function deleteContentBlock(
  state: WorkspaceState,
  pageId: string,
  blockId: string
): WorkspaceState {
  const page = state.pages[pageId];
  if (!page || page.type !== "document") {
    throw new Error("Can only delete content blocks from document pages");
  }

  const content = page.content || [];
  const newContent = content.filter((b) => b.id !== blockId);

  return updatePage(state, pageId, { content: newContent });
}

/**
 * Updates database config for a database page
 */
export function updateDatabaseConfig(
  state: WorkspaceState,
  pageId: string,
  updates: Partial<DatabaseConfig>
): WorkspaceState {
  const page = state.pages[pageId];
  if (!page || page.type !== "database") {
    throw new Error("Can only update database config for database pages");
  }

  const newConfig = {
    ...page.databaseConfig,
    ...updates,
  } as DatabaseConfig;

  return updatePage(state, pageId, { databaseConfig: newConfig });
}

/**
 * Gets the page tree structure for a workspace
 */
export interface PageTreeNode {
  page: Page;
  children: PageTreeNode[];
  depth: number;
}

export function getPageTree(
  pages: Record<string, Page>,
  workspaceId: string,
  parentId?: string,
  depth = 0
): PageTreeNode[] {
  const children = getPageChildren(pages, parentId || "").filter(
    (p) => p.workspaceId === workspaceId
  );

  return children.map((page) => ({
    page,
    depth,
    children: getPageTree(pages, workspaceId, page.id, depth + 1),
  }));
}

/**
 * Finds pages by title (search functionality)
 */
export function searchPages(
  pages: Record<string, Page>,
  query: string,
  workspaceId?: string
): Page[] {
  const lowerQuery = query.toLowerCase();

  return Object.values(pages)
    .filter((page) => {
      if (workspaceId && page.workspaceId !== workspaceId) return false;
      return page.title.toLowerCase().includes(lowerQuery);
    })
    .sort((a, b) => {
      // Prioritize exact matches
      const aExact = a.title.toLowerCase() === lowerQuery;
      const bExact = b.title.toLowerCase() === lowerQuery;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      // Then by updated date
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
}

/**
 * Duplicates a page (without children by default)
 */
export function duplicatePage(
  state: WorkspaceState,
  pageId: string,
  includeChildren = false
): WorkspaceState {
  const page = state.pages[pageId];
  if (!page) {
    throw new Error(`Page ${pageId} not found`);
  }

  const now = new Date().toISOString();
  const newPageId = `page-${uid()}`;

  const newPage: Page = {
    ...page,
    id: newPageId,
    title: `${page.title} (Copy)`,
    position: page.position + 1,
    createdAt: now,
    updatedAt: now,
  };

  let newState = addPageToState(state, newPage);

  if (includeChildren) {
    const children = getPageChildren(state.pages, pageId);
    children.forEach((child) => {
      newState = duplicatePage(newState, child.id, true);
      // Update the duplicated child's parent to the new page
      const duplicatedChild = Object.values(newState.pages).find(
        (p) => p.title === `${child.title} (Copy)` && p.parentPageId === child.parentPageId
      );
      if (duplicatedChild) {
        newState = updatePage(newState, duplicatedChild.id, { parentPageId: newPageId });
      }
    });
  }

  return newState;
}
