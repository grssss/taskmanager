"use client";

import { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Table2,
  Search,
  MoreHorizontal,
  Trash2,
  Edit2,
  X,
  PanelLeftClose,
} from "lucide-react";
import {
  WorkspaceState,
  Page,
  getPageChildren,
  getRootPages,
} from "@/lib/types";
import {
  createPage,
  addPageToState,
  deletePage,
  updatePage,
  togglePageCollapsed,
  reorderPages,
} from "@/lib/pageUtils";
import UserProfile from "@/components/UserProfile";
import Dialog from "./Dialog";

interface SidebarProps {
  workspaceState: WorkspaceState;
  onStateChange: (state: WorkspaceState) => void;
  onPageSelect: (pageId: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const countDescendants = (pages: Record<string, Page>, pageId: string): number => {
  const stack = getPageChildren(pages, pageId);
  let count = 0;

  while (stack.length) {
    const current = stack.pop();
    if (!current) continue;
    count += 1;
    stack.push(...getPageChildren(pages, current.id));
  }

  return count;
};

export default function Sidebar({
  workspaceState,
  onStateChange,
  onPageSelect,
  collapsed,
  onToggleCollapse,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [contextMenu, setContextMenu] = useState<{
    pageId: string;
    x: number;
    y: number;
  } | null>(null);
  const [draggedPageId, setDraggedPageId] = useState<string | null>(null);
  const [dropTargetPageId, setDropTargetPageId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<"before" | "after" | null>(null);
  const [renamingPageId, setRenamingPageId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [pagePendingDelete, setPagePendingDelete] = useState<Page | null>(null);

  // Detect mobile/iPhone
  useEffect(() => {
    const checkMobile = () => {
      if (typeof window === 'undefined') return;
      const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
      setIsMobile(isMobileDevice);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // On desktop, show collapsed sidebar
  if (collapsed && !isMobile) {
    return (
      <div className="w-12 bg-zinc-900 border-r border-white/10 flex flex-col items-center py-4">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-md hover:bg-zinc-800 transition-colors"
          title="Expand sidebar"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    );
  }

  // On mobile, always render the sidebar (visibility controlled by mobileOpen prop)
  // Don't return null here - we need the sidebar to slide in/out

  const handleCreatePage = (parentPageId?: string) => {
    const newPage = createPage(
      workspaceState.activeWorkspaceId,
      "Untitled",
      parentPageId
    );

    try {
      let newState = addPageToState(workspaceState, newPage);

      if (parentPageId) {
        const parent = newState.pages[parentPageId];
        if (parent && parent.collapsed) {
          newState = updatePage(newState, parentPageId, { collapsed: false });
        }
      }

      onStateChange({
        ...newState,
        activePageId: newPage.id,
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to create board");
    }
  };

  const pendingDescendantCount = pagePendingDelete
    ? countDescendants(workspaceState.pages, pagePendingDelete.id)
    : 0;

  const openDeleteDialog = (pageId: string) => {
    const targetPage = workspaceState.pages[pageId];
    if (!targetPage) return;
    setPagePendingDelete(targetPage);
  };

  const closeDeleteDialog = () => setPagePendingDelete(null);

  const confirmDelete = () => {
    if (!pagePendingDelete) return;
    try {
      const newState = deletePage(workspaceState, pagePendingDelete.id);
      onStateChange(newState);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete board");
    } finally {
      setPagePendingDelete(null);
    }
  };
  const handleRenamePage = (pageId: string, newTitle?: string) => {
    const page = workspaceState.pages[pageId];

    // If no new title provided, use prompt (for context menu)
    const title = newTitle !== undefined ? newTitle : prompt("New board name:", page?.title || "");
    if (!title || !page) return;

    try {
      const newState = updatePage(workspaceState, pageId, { title });
      onStateChange(newState);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to rename board");
    }
  };

  const handleToggleCollapsed = (pageId: string) => {
    const newState = togglePageCollapsed(workspaceState, pageId);
    onStateChange(newState);
  };

  const handleDragStart = (pageId: string) => {
    setDraggedPageId(pageId);
  };

  const handleDragOver = (e: React.DragEvent, pageId: string) => {
    e.preventDefault();
    if (draggedPageId === pageId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const position = e.clientY < midpoint ? "before" : "after";

    setDropTargetPageId(pageId);
    setDropPosition(position);
  };

  const handleDragLeave = () => {
    setDropTargetPageId(null);
    setDropPosition(null);
  };

  const handleDrop = (e: React.DragEvent, targetPageId: string) => {
    e.preventDefault();
    if (!draggedPageId || draggedPageId === targetPageId) {
      setDraggedPageId(null);
      setDropTargetPageId(null);
      setDropPosition(null);
      return;
    }

    const draggedPage = workspaceState.pages[draggedPageId];
    const targetPage = workspaceState.pages[targetPageId];

    if (!draggedPage || !targetPage) return;

    // Only allow reordering within the same parent
    if (draggedPage.parentPageId !== targetPage.parentPageId) {
      setDraggedPageId(null);
      setDropTargetPageId(null);
      setDropPosition(null);
      return;
    }

    // Get all siblings
    const siblings = getPageChildren(workspaceState.pages, draggedPage.parentPageId || "")
      .filter((p) => p.workspaceId === workspaceState.activeWorkspaceId && (!draggedPage.parentPageId || p.parentPageId === draggedPage.parentPageId));

    // If no parent, get root pages instead
    const allSiblings = draggedPage.parentPageId
      ? siblings
      : getRootPages(workspaceState.pages, workspaceState.activeWorkspaceId);

    // Remove the dragged page from siblings
    const filteredSiblings = allSiblings.filter((p) => p.id !== draggedPageId);

    // Find the target index
    const targetIndex = filteredSiblings.findIndex((p) => p.id === targetPageId);
    if (targetIndex === -1) return;

    // Insert the dragged page at the new position
    const newOrder = [...filteredSiblings];
    const insertIndex = dropPosition === "before" ? targetIndex : targetIndex + 1;
    newOrder.splice(insertIndex, 0, draggedPage);

    // Update the state with new order
    const newState = reorderPages(
      workspaceState,
      newOrder.map((p) => p.id),
      draggedPage.parentPageId
    );

    onStateChange(newState);

    setDraggedPageId(null);
    setDropTargetPageId(null);
    setDropPosition(null);
  };

  const handleDragEnd = () => {
    setDraggedPageId(null);
    setDropTargetPageId(null);
    setDropPosition(null);
  };

  const rootPages = getRootPages(
    workspaceState.pages,
    workspaceState.activeWorkspaceId
  );
  const databaseRootPages = rootPages.filter((page) => page.type === "database");
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const matchesSearch = (page: Page) =>
    !normalizedQuery || page.title.toLowerCase().includes(normalizedQuery);
  const visibleDatabasePages = databaseRootPages.filter(matchesSearch);

  // Debug logging
  console.log('[Sidebar] Active Workspace ID:', workspaceState.activeWorkspaceId);
  console.log('[Sidebar] Total pages in state:', Object.keys(workspaceState.pages).length);
  console.log('[Sidebar] Root pages found:', rootPages.length);
  console.log('[Sidebar] Root pages:', rootPages.map(p => ({ id: p.id, title: p.title, workspaceId: p.workspaceId, parentPageId: p.parentPageId })));
  console.log('[Sidebar] All pages:', Object.values(workspaceState.pages).map(p => ({ id: p.id, title: p.title, workspaceId: p.workspaceId, parentPageId: p.parentPageId })));

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onMobileClose}
        />
      )}

      <div className={`
        w-64 bg-zinc-900 border-r border-white/10 flex flex-col h-screen
        ${isMobile ? 'fixed left-0 top-0 z-50 transition-transform duration-300' : ''}
        ${isMobile && !mobileOpen ? '-translate-x-full' : 'translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-4 border-b border-white/5 bg-gradient-to-b from-zinc-950 to-zinc-900 relative">
          <div className="flex items-start gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <UserProfile />
            </div>
            {!isMobile ? (
              <button
                onClick={onToggleCollapse}
                className="p-2 rounded-md hover:bg-zinc-800 transition-colors text-zinc-300"
                title="Collapse sidebar"
              >
                <PanelLeftClose size={18} />
              </button>
            ) : (
              <button
                onClick={onMobileClose}
                className="p-2 rounded-md hover:bg-zinc-800 transition-colors text-zinc-300"
                title="Close sidebar"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search
              size={14}
              className="absolute left-2 top-2 text-zinc-400"
            />
            <input
              type="text"
              placeholder="Search boards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-white/15 bg-zinc-900/70 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>
        </div>

        {/* Pages list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          <div className="flex items-center justify-between px-2 relative">
            <span className="text-xs text-zinc-400 uppercase font-medium tracking-wide">
              Boards
            </span>
            <button
              onClick={() => handleCreatePage()}
              className="p-1 rounded hover:bg-zinc-800 transition-colors"
              title="New board"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="space-y-0.5 px-0.5">
            {visibleDatabasePages.map((page) => (
              <PageTreeItem
                key={page.id}
                page={page}
                pages={workspaceState.pages}
                activePageId={workspaceState.activePageId}
                onSelect={onPageSelect}
                onToggleCollapsed={handleToggleCollapsed}
                onContextMenu={(pageId, x, y) => setContextMenu({ pageId, x, y })}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                draggedPageId={draggedPageId}
                dropTargetPageId={dropTargetPageId}
                dropPosition={dropPosition}
                renamingPageId={renamingPageId}
                onStartRename={setRenamingPageId}
                onRename={handleRenamePage}
                level={0}
                variant="database"
                hideChildren
              />
            ))}
            {visibleDatabasePages.length === 0 && (
              <div className="text-xs text-zinc-500 px-2 py-1.5 rounded-md bg-white/5">
                {normalizedQuery ? "No matching boards" : "No boards yet"}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed z-50 bg-zinc-800 border border-white/10 rounded-md shadow-lg py-1 min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={() => {
                handleRenamePage(contextMenu.pageId);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-700 text-left"
            >
              <Edit2 size={14} />
              Rename
            </button>
            <div className="border-t border-white/10 my-1" />
            <button
              onClick={() => {
                openDeleteDialog(contextMenu.pageId);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 text-left"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </>
      )}

      <Dialog
        open={Boolean(pagePendingDelete)}
        onClose={closeDeleteDialog}
        title={
          pagePendingDelete ? `Delete "${pagePendingDelete.title}"?` : "Delete board"
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-300">
            This action will permanently delete the board and all of its tasks.
            {pagePendingDelete && (
              <>
                {" "}
                {pendingDescendantCount > 0
                  ? `It will also remove ${pendingDescendantCount} nested ${
                      pendingDescendantCount === 1 ? "board" : "boards"
                    }.`
                  : "There are no nested boards."}
              </>
            )}
          </p>
          <div className="text-xs text-zinc-500 border border-dashed border-white/10 rounded-lg p-3">
            <p className="font-semibold text-zinc-100">
              Page ID: {pagePendingDelete?.id}
            </p>
            <p>Make sure you have backups if this is important content.</p>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={closeDeleteDialog}
              className="px-4 py-2 rounded-md border border-white/10 text-sm text-zinc-200 hover:border-zinc-300 transition"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 rounded-md bg-red-600 text-sm text-white hover:bg-red-500 transition"
            >
              Delete board
            </button>
          </div>
        </div>
      </Dialog>

    </>
  );
}

interface PageTreeItemProps {
  page: Page;
  pages: Record<string, Page>;
  activePageId?: string;
  onSelect: (pageId: string) => void;
  onToggleCollapsed: (pageId: string) => void;
  onContextMenu: (pageId: string, x: number, y: number) => void;
  onDragStart: (pageId: string) => void;
  onDragOver: (e: React.DragEvent, pageId: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, pageId: string) => void;
  onDragEnd: () => void;
  draggedPageId: string | null;
  dropTargetPageId: string | null;
  dropPosition: "before" | "after" | null;
  renamingPageId: string | null;
  onStartRename: (pageId: string | null) => void;
  onRename: (pageId: string, newTitle: string) => void;
  level: number;
  variant?: "default" | "database";
  hideChildren?: boolean;
  allowedChildTypes?: Page["type"][];
  onAddChild?: (parentId: string) => void;
  showAddButton?: boolean;
}

function PageTreeItem({
  page,
  pages,
  activePageId,
  onSelect,
  onToggleCollapsed,
  onContextMenu,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  draggedPageId,
  dropTargetPageId,
  dropPosition,
  renamingPageId,
  onStartRename,
  onRename,
  level,
  variant = "default",
  hideChildren = false,
  allowedChildTypes,
  onAddChild,
  showAddButton = false,
}: PageTreeItemProps) {
  const [renameValue, setRenameValue] = useState(page.title);
  const childCandidates = hideChildren ? [] : getPageChildren(pages, page.id);
  const children = allowedChildTypes
    ? childCandidates.filter((child) => allowedChildTypes.includes(child.type))
    : childCandidates;
  const hasChildren = children.length > 0;
  const isActive = page.id === activePageId;
  const isDragging = draggedPageId === page.id;
  const isDropTarget = dropTargetPageId === page.id;
  const isRenaming = renamingPageId === page.id;
  const showToggle = !hideChildren && hasChildren;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(page.id, e.clientX, e.clientY);
  };

  const handleRenameSubmit = () => {
    if (renameValue.trim() && renameValue !== page.title) {
      onRename(page.id, renameValue.trim());
    } else {
      setRenameValue(page.title);
    }
    onStartRename(null);
  };

  const handleRenameCancel = () => {
    setRenameValue(page.title);
    onStartRename(null);
  };

  return (
    <div className="relative">
      {isDropTarget && dropPosition === "before" && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 z-10" />
      )}
      <div
        draggable
        onDragStart={(e) => {
          e.stopPropagation();
          onDragStart(page.id);
        }}
        onDragOver={(e) => {
          e.stopPropagation();
          onDragOver(e, page.id);
        }}
        onDragLeave={(e) => {
          e.stopPropagation();
          onDragLeave();
        }}
        onDrop={(e) => {
          e.stopPropagation();
          onDrop(e, page.id);
        }}
        onDragEnd={(e) => {
          e.stopPropagation();
          onDragEnd();
        }}
        onClick={() => onSelect(page.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect(page.id);
          }
        }}
        onContextMenu={handleContextMenu}
        className={`w-full flex items-center gap-1.5 px-2 py-1.5 text-sm rounded-md transition-colors group ${
          isActive
            ? "bg-zinc-700 text-zinc-200"
            : "hover:bg-zinc-800 text-zinc-200"
        } ${isDragging ? "opacity-50" : ""}`}
        role="button"
        tabIndex={0}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {showToggle && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapsed(page.id);
            }}
            className="shrink-0"
          >
            {page.collapsed ? (
              <ChevronRight size={14} />
            ) : (
              <ChevronDown size={14} />
            )}
          </span>
        )}

        <span className="shrink-0">
          <Table2 size={14} />
        </span>

        {isRenaming ? (
          <input
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleRenameSubmit();
              } else if (e.key === "Escape") {
                e.preventDefault();
                handleRenameCancel();
              }
            }}
            onClick={(e) => e.stopPropagation()}
            autoFocus
            className="flex-1 bg-zinc-800 border border-white/20 rounded px-1 py-0.5 text-sm outline-none focus:ring-1 focus:ring-white/40"
          />
        ) : (
          <span 
            className="truncate flex-1 text-left"
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
          >
            {page.title}
          </span>
        )}

        <span
          onClick={(e) => {
            e.stopPropagation();
            handleContextMenu(e);
          }}
          className={`shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${
            isActive ? "opacity-100" : ""
          }`}
        >
          <MoreHorizontal size={14} />
        </span>

        {showAddButton && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddChild?.(page.id);
            }}
            className="shrink-0 p-1 rounded hover:bg-zinc-700 transition-colors opacity-0 group-hover:opacity-100 text-zinc-300"
            title="Add subpage"
          >
            <Plus size={12} />
          </button>
        )}
      </div>
      {isDropTarget && dropPosition === "after" && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 z-10" />
      )}

      {/* Children */}
      {hasChildren && !page.collapsed && !hideChildren && (
        <div className="mt-0.5">
          {children.map((child) => (
            <PageTreeItem
              key={child.id}
              page={child}
              pages={pages}
              activePageId={activePageId}
              onSelect={onSelect}
              onToggleCollapsed={onToggleCollapsed}
              onContextMenu={onContextMenu}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onDragEnd={onDragEnd}
              draggedPageId={draggedPageId}
              dropTargetPageId={dropTargetPageId}
              dropPosition={dropPosition}
              renamingPageId={renamingPageId}
              onStartRename={onStartRename}
              onRename={onRename}
              level={level + 1}
              variant={variant}
              hideChildren={hideChildren}
              allowedChildTypes={allowedChildTypes}
              onAddChild={onAddChild}
              showAddButton={showAddButton}
            />
          ))}
        </div>
      )}
    </div>
  );
}
