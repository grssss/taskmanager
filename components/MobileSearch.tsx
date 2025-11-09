"use client";

import { useState } from "react";
import { Search, FileText, Table2, X } from "lucide-react";
import { WorkspaceState, Page } from "@/lib/types";

interface MobileSearchProps {
  workspaceState: WorkspaceState;
  onPageSelect: (pageId: string) => void;
  onClose?: () => void;
}

export default function MobileSearch({
  workspaceState,
  onPageSelect,
  onClose,
}: MobileSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter pages based on search query
  const filteredPages = Object.values(workspaceState.pages).filter((page) => {
    if (!searchQuery.trim()) return true;
    return page.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 pb-20">
      {/* Search header */}
      <div className="px-4 pt-6 pb-4 border-b border-white/10">
        <div className="relative">
          <Search
            size={20}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="text"
            placeholder="Search pages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            className="w-full pl-11 pr-10 py-3 text-base rounded-lg bg-zinc-900 border border-white/10 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Search results */}
      <div className="flex-1 overflow-y-auto px-4 pt-4">
        {filteredPages.length > 0 ? (
          <div className="space-y-1">
            {filteredPages.map((page) => (
              <button
                key={page.id}
                onClick={() => {
                  onPageSelect(page.id);
                  if (onClose) onClose();
                }}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-900 transition-colors text-left"
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
                  <p className="text-xs text-zinc-500 truncate">
                    {page.type === "database" ? "Database" : "Document"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-zinc-500 text-sm">
            {searchQuery ? "No pages found" : "Start typing to search"}
          </div>
        )}
      </div>
    </div>
  );
}
