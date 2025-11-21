"use client";

import { WorkspaceState, isDatabasePage } from "@/lib/types";
import { getPagePath } from "@/lib/types";
import DatabasePageView from "./DatabasePageView";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";

interface PageCanvasProps {
  workspaceState: WorkspaceState;
  onStateChange: (state: WorkspaceState) => void;
  onPageSelect: (pageId: string) => void;
  onBackClick?: () => void;
}

export default function PageCanvas({
  workspaceState,
  onStateChange,
  onPageSelect,
  onBackClick,
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
            No board selected
          </p>
          <p className="text-sm text-zinc-500">
            Select a board from the sidebar or create a new one
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
          <p className="text-red-500 mb-2">Board not found</p>
          <p className="text-sm text-zinc-400">
            Page ID: {activePageId}
          </p>
        </div>
      </div>
    );
  }

  const breadcrumbs = getPagePath(pages, activePageId);

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 overflow-hidden">
      {/* Breadcrumb */}
      <div className="bg-zinc-950 px-6 py-3">
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
        ) : (
          <div className="p-6">
            <p className="text-red-500">Unsupported page type: {activePage.type}</p>
            <p className="text-sm text-zinc-400 mt-2">
              Documents are no longer available in this workspace. Please migrate any remaining content manually.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
