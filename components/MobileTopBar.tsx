"use client";

import { useAuth } from "@/lib/AuthContext";
import { WorkspaceState } from "@/lib/types";

interface MobileTopBarProps {
  workspaceState: WorkspaceState;
}

export default function MobileTopBar({ workspaceState }: MobileTopBarProps) {
  const { user } = useAuth();

  if (!user) return null;

  const activeWorkspace = workspaceState.workspaces.find(
    (w) => w.id === workspaceState.activeWorkspaceId
  );

  return (
    <>
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-zinc-900 border-b border-white/10 px-4 py-3 flex items-center justify-between">
        {/* User profile display */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium">
            {user.email?.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm text-zinc-100 max-w-[140px] truncate">
            {user.email}
          </span>
        </div>

        {/* Workspace context */}
        <div className="text-sm text-zinc-400">
          {activeWorkspace?.icon} {activeWorkspace?.name}
        </div>
      </div>
    </>
  );
}
