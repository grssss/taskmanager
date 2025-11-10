"use client";

import { WorkspaceState, Page, isDatabasePage, isDocumentPage } from "@/lib/types";
import { getPagePath } from "@/lib/types";
import DatabasePageView from "./DatabasePageView";
import DocumentPageView from "./DocumentPageView";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { useState, useEffect, ReactNode } from "react";

interface PageCanvasProps {
  workspaceState: WorkspaceState;
  onStateChange: (state: WorkspaceState) => void;
  onPageSelect: (pageId: string) => void;
  onBackClick?: () => void;
  onEditingChange?: (isEditing: boolean) => void;
  workspaceSwitcherSlot?: ReactNode;
}

export default function PageCanvas({
  workspaceState,
  onStateChange,
  onPageSelect,
  onBackClick,
  onEditingChange,
  workspaceSwitcherSlot,
}: PageCanvasProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      if (typeof window === 'undefined') return;
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const { activePageId, pages } = workspaceState;

  if (!activePageId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-950">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">
            No page selected
          </p>
          <p className="text-sm text-zinc-500">
            Select a page from the sidebar or create a new one
          </p>
        </div>
      </div>
    );
  }

  const activePage = pages[activePageId];

  if (!activePage) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-950">
        <div className="text-center">
          <p className="text-red-500 mb-2">Page not found</p>
          <p className="text-sm text-zinc-400">
            Page ID: {activePageId}
          </p>
        </div>
      </div>
    );
  }

  const breadcrumbs = getPagePath(pages, activePageId);

  const isDocument = isDocumentPage(activePage);
  const hideChromeOnMobile = isMobile && isDocument;

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 overflow-hidden">
      {/* Breadcrumb */}
      {!hideChromeOnMobile && (
        <div className="border-b border-white/10 bg-zinc-950 px-6 py-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-400">
              {/* Mobile back button */}
              {isMobile && onBackClick && (
                <button
                  onClick={onBackClick}
                  className="flex items-center gap-1 text-zinc-400 hover:text-zinc-100 transition-colors mr-2"
                >
                  <ArrowLeft size={18} />
                </button>
              )}
              {breadcrumbs.length === 0 && (
                <span className="text-zinc-500">Workspace</span>
              )}
              {breadcrumbs.slice(0, -1).map((page, index) => (
                <div key={page.id} className="flex items-center gap-2">
                  {index > 0 && <ChevronRight size={14} />}
                  <button
                    onClick={() => onPageSelect(page.id)}
                    className="hover:text-zinc-100 transition-colors"
                  >
                    {page.icon && <span className="mr-1">{page.icon}</span>}
                    {page.title}
                  </button>
                </div>
              ))}
              {breadcrumbs.length > 0 && (
                <div className="flex items-center gap-2 text-zinc-100 font-medium truncate">
                  {breadcrumbs.length > 1 && <ChevronRight size={14} />}
                  <span className="truncate">
                    {activePage.icon && <span className="mr-1">{activePage.icon}</span>}
                    {activePage.title || "Untitled"}
                  </span>
                </div>
              )}
            </div>
            {!isMobile && workspaceSwitcherSlot && (
              <div className="shrink-0">{workspaceSwitcherSlot}</div>
            )}
          </div>
        </div>
      )}

      {/* Page content */}
      <div className={`flex-1 overflow-auto ${hideChromeOnMobile ? 'pt-0' : ''}`}>
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
            onEditingChange={onEditingChange}
            onBackClick={isMobile ? onBackClick : undefined}
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
