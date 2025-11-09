"use client";

import { useState } from "react";
import { FileText, Table2, ChevronRight } from "lucide-react";
import { WorkspaceState, Page, getRootPages } from "@/lib/types";

interface MobileHomeProps {
  workspaceState: WorkspaceState;
  onPageSelect: (pageId: string) => void;
}

export default function MobileHome({
  workspaceState,
  onPageSelect,
}: MobileHomeProps) {
  const rootPages = getRootPages(
    workspaceState.pages,
    workspaceState.activeWorkspaceId
  );

  // Get recently accessed pages (for now, just show first 3 pages)
  const recentPages = rootPages.slice(0, 3);

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 pb-20">
      {/* Jump back in section */}
      {recentPages.length > 0 && (
        <div className="px-4 pt-6 pb-4">
          <h2 className="text-sm font-medium text-zinc-400 mb-3">Jump back in</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {recentPages.map((page) => (
              <button
                key={page.id}
                onClick={() => onPageSelect(page.id)}
                className="flex-shrink-0 w-40 h-32 bg-zinc-900 rounded-lg border border-white/10 p-4 flex flex-col items-start justify-between hover:bg-zinc-800 transition-colors"
              >
                <div className="w-10 h-10 flex items-center justify-center text-zinc-400">
                  {page.type === "database" ? (
                    <Table2 size={28} />
                  ) : (
                    <FileText size={28} />
                  )}
                </div>
                <div className="w-full">
                  <p className="text-sm font-medium text-zinc-100 truncate">
                    {page.icon && <span className="mr-1">{page.icon}</span>}
                    {page.title}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Private section with pages list */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-zinc-400">Private</h2>
          <ChevronRight size={16} className="text-zinc-400" />
        </div>

        {/* Pages list */}
        <div className="space-y-1">
          {rootPages.map((page) => (
            <button
              key={page.id}
              onClick={() => onPageSelect(page.id)}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-900 transition-colors text-left group"
            >
              <div className="flex items-center justify-center text-zinc-400">
                {page.type === "database" ? (
                  <Table2 size={20} />
                ) : (
                  <FileText size={20} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-100 truncate">
                  {page.icon && <span className="mr-1">{page.icon}</span>}
                  {page.title}
                </p>
              </div>
              <ChevronRight
                size={16}
                className="text-zinc-600 group-hover:text-zinc-400 transition-colors"
              />
            </button>
          ))}
        </div>

        {rootPages.length === 0 && (
          <div className="text-center py-8 text-zinc-500 text-sm">
            No pages yet. Tap the + button to create one.
          </div>
        )}
      </div>
    </div>
  );
}
