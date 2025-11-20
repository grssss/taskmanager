"use client";

import { Table2 } from "lucide-react";
import { WorkspaceState } from "@/lib/types";
import { createPage, addPageToState } from "@/lib/pageUtils";

interface MobileNewPageProps {
  workspaceState: WorkspaceState;
  onStateChange: (state: WorkspaceState) => void;
  onPageSelect: (pageId: string) => void;
  onClose?: () => void;
}

export default function MobileNewPage({
  workspaceState,
  onStateChange,
  onPageSelect,
  onClose,
}: MobileNewPageProps) {
  const handleCreateBoard = () => {
    const newPage = createPage(
      workspaceState.activeWorkspaceId,
      "Untitled"
    );

    try {
      const newState = addPageToState(workspaceState, newPage);
      onStateChange({
        ...newState,
        activePageId: newPage.id,
      });
      onPageSelect(newPage.id);
      if (onClose) onClose();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to create board");
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 pb-20">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 border-b border-white/10">
        <h1 className="text-2xl font-semibold text-zinc-100">Create new board</h1>
      </div>

      {/* Options */}
      <div className="flex-1 px-4 pt-6">
        <div className="space-y-3">
          <button
            onClick={handleCreateBoard}
            className="w-full flex items-start gap-4 p-4 rounded-lg bg-zinc-900 border border-white/10 hover:bg-zinc-800 transition-colors text-left"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-zinc-800 text-zinc-400">
              <Table2 size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-medium text-zinc-100 mb-1">
                Board
              </h3>
              <p className="text-sm text-zinc-400">
                Create a kanban board to organize and track tasks
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
