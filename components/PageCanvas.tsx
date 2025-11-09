"use client";

import { WorkspaceState, Page, isDatabasePage, isDocumentPage } from "@/lib/types";
import { getPagePath } from "@/lib/types";
import DatabasePageView from "./DatabasePageView";
import DocumentPageView from "./DocumentPageView";
import { ChevronRight } from "lucide-react";

interface PageCanvasProps {
  workspaceState: WorkspaceState;
  onStateChange: (state: WorkspaceState) => void;
  onPageSelect: (pageId: string) => void;
}

export default function PageCanvas({
  workspaceState,
  onStateChange,
  onPageSelect,
}: PageCanvasProps) {
  const { activePageId, pages } = workspaceState;

  if (!activePageId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-zinc-950">
        <div className="text-center">
          <p className="text-zinc-500 dark:text-zinc-400 mb-4">
            No page selected
          </p>
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            Select a page from the sidebar or create a new one
          </p>
        </div>
      </div>
    );
  }

  const activePage = pages[activePageId];

  if (!activePage) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-zinc-950">
        <div className="text-center">
          <p className="text-red-500 mb-2">Page not found</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Page ID: {activePageId}
          </p>
        </div>
      </div>
    );
  }

  const breadcrumbs = getPagePath(pages, activePageId);

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950 overflow-hidden">
      {/* Breadcrumb */}
      <div className="border-b border-black/10 dark:border-white/10 bg-white dark:bg-zinc-950 px-6 py-3">
        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          {breadcrumbs.map((page, index) => (
            <div key={page.id} className="flex items-center gap-2">
              {index > 0 && <ChevronRight size={14} />}
              <button
                onClick={() => onPageSelect(page.id)}
                className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                {page.icon && <span className="mr-1">{page.icon}</span>}
                {page.title}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Page content */}
      <div className="flex-1 overflow-auto">
        {isDatabasePage(activePage) ? (
          <DatabasePageView
            page={activePage}
            workspaceState={workspaceState}
            onStateChange={onStateChange}
          />
        ) : isDocumentPage(activePage) ? (
          <DocumentPageView
            page={activePage}
            workspaceState={workspaceState}
            onStateChange={onStateChange}
          />
        ) : (
          <div className="p-6">
            <p className="text-red-500">Unknown page type: {activePage.type}</p>
          </div>
        )}
      </div>
    </div>
  );
}
