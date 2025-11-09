"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  FileText,
  Table2,
  Search,
  MoreHorizontal,
  Trash2,
  Edit2,
} from "lucide-react";
import {
  WorkspaceState,
  Page,
  Workspace,
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

interface SidebarProps {
  workspaceState: WorkspaceState;
  onStateChange: (state: WorkspaceState) => void;
  onPageSelect: (pageId: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({
  workspaceState,
  onStateChange,
  onPageSelect,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [contextMenu, setContextMenu] = useState<{
    pageId: string;
    x: number;
    y: number;
  } | null>(null);
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [showNewPageMenu, setShowNewPageMenu] = useState(false);
  const [showSubpageMenu, setShowSubpageMenu] = useState<string | null>(null);
  const [draggedPageId, setDraggedPageId] = useState<string | null>(null);
  const [dropTargetPageId, setDropTargetPageId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<"before" | "after" | null>(null);

  const activeWorkspace = workspaceState.workspaces.find(
    (w) => w.id === workspaceState.activeWorkspaceId
  );

  const handleSwitchWorkspace = (workspaceId: string) => {
    const rootPages = getRootPages(workspaceState.pages, workspaceId);
    onStateChange({
      ...workspaceState,
      activeWorkspaceId: workspaceId,
      activePageId: rootPages[0]?.id,
    });
    setShowWorkspaceMenu(false);
  };

  if (collapsed) {
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

  const handleCreatePage = (type: "document" | "database", parentPageId?: string) => {
    const newPage = createPage(
      workspaceState.activeWorkspaceId,
      "Untitled",
      type,
      parentPageId
    );

    try {
      const newState = addPageToState(workspaceState, newPage);
      onStateChange({
        ...newState,
        activePageId: newPage.id,
      });
      setShowNewPageMenu(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to create page");
    }
  };

  const handleDeletePage = (pageId: string) => {
    if (!confirm("Delete this page and all its children?")) return;

    try {
      const newState = deletePage(workspaceState, pageId);
      onStateChange(newState);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete page");
    }
  };

  const handleRenamePage = (pageId: string) => {
    const page = workspaceState.pages[pageId];
    const newTitle = prompt("New title:", page?.title || "");
    if (!newTitle || !page) return;

    try {
      const newState = updatePage(workspaceState, pageId, { title: newTitle });
      onStateChange(newState);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to rename page");
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

  // Debug logging
  console.log('[Sidebar] Active Workspace ID:', workspaceState.activeWorkspaceId);
  console.log('[Sidebar] Total pages in state:', Object.keys(workspaceState.pages).length);
  console.log('[Sidebar] Root pages found:', rootPages.length);
  console.log('[Sidebar] Root pages:', rootPages.map(p => ({ id: p.id, title: p.title, workspaceId: p.workspaceId, parentPageId: p.parentPageId })));
  console.log('[Sidebar] All pages:', Object.values(workspaceState.pages).map(p => ({ id: p.id, title: p.title, workspaceId: p.workspaceId, parentPageId: p.parentPageId })));

  return (
    <>
      {/* Backdrop for workspace menu */}
      {showWorkspaceMenu && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowWorkspaceMenu(false)}
        />
      )}

      {/* Backdrop for new page menu */}
      {showNewPageMenu && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowNewPageMenu(false)}
        />
      )}

      <div className="w-64 bg-zinc-900 border-r border-white/10 flex flex-col h-screen">
        {/* Header */}
        <div className="p-4 border-b border-white/10 relative">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
              className="flex items-center gap-1 font-semibold text-sm truncate flex-1 hover:bg-zinc-800 rounded px-2 py-1 -ml-2 transition-colors"
            >
              <span className="truncate">
                {activeWorkspace?.icon} {activeWorkspace?.name}
              </span>
              <ChevronDown size={14} className={`shrink-0 transition-transform ${showWorkspaceMenu ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={onToggleCollapse}
              className="p-1 rounded hover:bg-zinc-800 transition-colors"
              title="Collapse sidebar"
            >
              <ChevronDown size={16} className="rotate-[-90deg]" />
            </button>
          </div>

          {/* Workspace selector dropdown */}
          {showWorkspaceMenu && (
            <div className="absolute top-full left-4 right-4 mt-1 z-40 border border-white/10 rounded-md bg-zinc-800 shadow-xl overflow-hidden">
              {workspaceState.workspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  onClick={() => handleSwitchWorkspace(workspace.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                    workspace.id === workspaceState.activeWorkspaceId
                      ? "bg-zinc-700"
                      : "hover:bg-zinc-700/50"
                  }`}
                >
                  <span>{workspace.icon}</span>
                  <span className="truncate">{workspace.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search
              size={14}
              className="absolute left-2 top-2 text-zinc-400"
            />
            <input
              type="text"
              placeholder="Search pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-white/10 bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-white"
            />
          </div>
        </div>

        {/* Pages list */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="flex items-center justify-between mb-2 px-2 relative">
            <span className="text-xs text-zinc-400 uppercase font-medium">
              Pages
            </span>
            <button
              onClick={() => setShowNewPageMenu(!showNewPageMenu)}
              className="p-1 rounded hover:bg-zinc-800 transition-colors"
              title="New page"
            >
              <Plus size={14} />
            </button>

            {/* New page menu */}
            {showNewPageMenu && (
              <div className="absolute top-full right-2 mt-1 z-40 border border-white/10 rounded-md bg-zinc-800 shadow-xl overflow-hidden min-w-[180px]">
                <button
                  onClick={() => handleCreatePage("document")}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-zinc-700 transition-colors"
                >
                  <FileText size={14} />
                  <span>Document Page</span>
                </button>
                <button
                  onClick={() => handleCreatePage("database")}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-zinc-700 transition-colors"
                >
                  <Table2 size={14} />
                  <span>Database Page</span>
                </button>
              </div>
            )}
          </div>

          <div className="space-y-0.5">
            {rootPages.map((page) => (
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
                level={0}
              />
            ))}
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
            <button
              onClick={() => {
                setShowSubpageMenu(contextMenu.pageId);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-700 text-left"
            >
              <Plus size={14} />
              Add subpage
              <ChevronRight size={14} className="ml-auto" />
            </button>
            <div className="border-t border-white/10 my-1" />
            <button
              onClick={() => {
                handleDeletePage(contextMenu.pageId);
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

      {/* Subpage type menu */}
      {showSubpageMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setShowSubpageMenu(null);
              setContextMenu(null);
            }}
          />
          <div
            className="fixed z-50 bg-zinc-800 border border-white/10 rounded-md shadow-lg py-1 min-w-[180px]"
            style={{
              left: contextMenu ? contextMenu.x + 170 : 0,
              top: contextMenu ? contextMenu.y + 30 : 0
            }}
          >
            <button
              onClick={() => {
                handleCreatePage("document", showSubpageMenu);
                setShowSubpageMenu(null);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-700 text-left"
            >
              <FileText size={14} />
              Document Page
            </button>
            <button
              onClick={() => {
                handleCreatePage("database", showSubpageMenu);
                setShowSubpageMenu(null);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-700 text-left"
            >
              <Table2 size={14} />
              Database Page
            </button>
          </div>
        </>
      )}
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
  level: number;
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
  level,
}: PageTreeItemProps) {
  const children = getPageChildren(pages, page.id);
  const hasChildren = children.length > 0;
  const isActive = page.id === activePageId;
  const isDragging = draggedPageId === page.id;
  const isDropTarget = dropTargetPageId === page.id;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(page.id, e.clientX, e.clientY);
  };

  return (
    <div className="relative">
      {isDropTarget && dropPosition === "before" && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 z-10" />
      )}
      <button
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
        onContextMenu={handleContextMenu}
        className={`w-full flex items-center gap-1.5 px-2 py-1.5 text-sm rounded-md transition-colors group ${
          isActive
            ? "bg-zinc-700 text-zinc-200"
            : "hover:bg-zinc-800 text-zinc-200"
        } ${isDragging ? "opacity-50" : ""}`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {hasChildren && (
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
          {page.type === "database" ? (
            <Table2 size={14} />
          ) : (
            <FileText size={14} />
          )}
        </span>

        <span className="truncate flex-1 text-left">
          {page.icon && <span className="mr-1">{page.icon}</span>}
          {page.title}
        </span>

        <span
          onClick={(e) => {
            e.stopPropagation();
            handleContextMenu(e as any);
          }}
          className={`shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${
            isActive ? "opacity-100" : ""
          }`}
        >
          <MoreHorizontal size={14} />
        </span>
      </button>
      {isDropTarget && dropPosition === "after" && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 z-10" />
      )}

      {/* Children */}
      {hasChildren && !page.collapsed && (
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
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
