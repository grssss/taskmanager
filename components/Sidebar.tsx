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

  const activeWorkspace = workspaceState.workspaces.find(
    (w) => w.id === workspaceState.activeWorkspaceId
  );

  if (collapsed) {
    return (
      <div className="w-12 bg-zinc-50 dark:bg-zinc-900 border-r border-black/10 dark:border-white/10 flex flex-col items-center py-4">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          title="Expand sidebar"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    );
  }

  const handleCreatePage = (parentPageId?: string) => {
    const title = prompt("Page title:", "Untitled");
    if (!title) return;

    const type = confirm("Create a database page? (Cancel for document page)")
      ? "database"
      : "document";

    const newPage = createPage(
      workspaceState.activeWorkspaceId,
      title,
      type,
      parentPageId
    );

    try {
      const newState = addPageToState(workspaceState, newPage);
      onStateChange({
        ...newState,
        activePageId: newPage.id,
      });
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

  const rootPages = getRootPages(
    workspaceState.pages,
    workspaceState.activeWorkspaceId
  );

  return (
    <>
      <div className="w-64 bg-zinc-50 dark:bg-zinc-900 border-r border-black/10 dark:border-white/10 flex flex-col h-screen">
        {/* Header */}
        <div className="p-4 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm truncate flex-1">
              {activeWorkspace?.icon} {activeWorkspace?.name}
            </h2>
            <button
              onClick={onToggleCollapse}
              className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
              title="Collapse sidebar"
            >
              <ChevronDown size={16} className="rotate-[-90deg]" />
            </button>
          </div>

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
              className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
            />
          </div>
        </div>

        {/* Pages list */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="flex items-center justify-between mb-2 px-2">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 uppercase font-medium">
              Pages
            </span>
            <button
              onClick={() => handleCreatePage()}
              className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
              title="New page"
            >
              <Plus size={14} />
            </button>
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
                level={0}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-black/10 dark:border-white/10">
          <button
            onClick={() => handleCreatePage()}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            New Page
          </button>
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
            className="fixed z-50 bg-white dark:bg-zinc-800 border border-black/10 dark:border-white/10 rounded-md shadow-lg py-1 min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={() => {
                handleRenamePage(contextMenu.pageId);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 text-left"
            >
              <Edit2 size={14} />
              Rename
            </button>
            <button
              onClick={() => {
                handleCreatePage(contextMenu.pageId);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 text-left"
            >
              <Plus size={14} />
              Add subpage
            </button>
            <div className="border-t border-black/10 dark:border-white/10 my-1" />
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
  level: number;
}

function PageTreeItem({
  page,
  pages,
  activePageId,
  onSelect,
  onToggleCollapsed,
  onContextMenu,
  level,
}: PageTreeItemProps) {
  const children = getPageChildren(pages, page.id);
  const hasChildren = children.length > 0;
  const isActive = page.id === activePageId;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(page.id, e.clientX, e.clientY);
  };

  return (
    <div>
      <button
        onClick={() => onSelect(page.id)}
        onContextMenu={handleContextMenu}
        className={`w-full flex items-center gap-1.5 px-2 py-1.5 text-sm rounded-md transition-colors group ${
          isActive
            ? "bg-black text-white dark:bg-white dark:text-black"
            : "hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
        }`}
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
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
