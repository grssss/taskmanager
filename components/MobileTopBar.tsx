"use client";

import { useAuth } from "@/lib/AuthContext";
import { User, ChevronDown } from "lucide-react";
import { useState } from "react";
import { WorkspaceState } from "@/lib/types";

interface MobileTopBarProps {
  workspaceState: WorkspaceState;
  onWorkspaceChange: (workspaceId: string) => void;
}

export default function MobileTopBar({
  workspaceState,
  onWorkspaceChange,
}: MobileTopBarProps) {
  const { user, signOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  if (!user) return null;

  const activeWorkspace = workspaceState.workspaces.find(
    (w) => w.id === workspaceState.activeWorkspaceId
  );

  return (
    <>
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-zinc-900 border-b border-white/10 px-4 py-3 flex items-center justify-between">
        {/* User profile button */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-2 hover:bg-zinc-700 transition-colors"
        >
          <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium">
            {user.email?.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm text-zinc-100 max-w-[120px] truncate">
            {user.email}
          </span>
          <ChevronDown
            size={16}
            className={`text-zinc-400 transition-transform ${
              showMenu ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Workspace selector */}
        <div className="text-sm text-zinc-400">
          {activeWorkspace?.icon} {activeWorkspace?.name}
        </div>
      </div>

      {/* Dropdown menu */}
      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div className="fixed top-14 left-4 right-4 z-50 bg-zinc-800 border border-white/10 rounded-lg shadow-xl overflow-hidden">
            <div className="p-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-100 truncate">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Workspace list */}
            {workspaceState.workspaces.length > 1 && (
              <div className="border-b border-white/10">
                <div className="px-3 py-2 text-xs text-zinc-500 uppercase font-medium">
                  Workspaces
                </div>
                {workspaceState.workspaces.map((workspace) => (
                  <button
                    key={workspace.id}
                    onClick={() => {
                      onWorkspaceChange(workspace.id);
                      setShowMenu(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                      workspace.id === workspaceState.activeWorkspaceId
                        ? "bg-zinc-700 text-zinc-100"
                        : "text-zinc-300 hover:bg-zinc-700/50"
                    }`}
                  >
                    <span>{workspace.icon}</span>
                    <span className="truncate">{workspace.name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Sign out */}
            <button
              onClick={() => {
                signOut();
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-3 text-sm text-red-400 hover:bg-zinc-700/50 transition-colors"
            >
              <User size={16} />
              <span>Sign out</span>
            </button>
          </div>
        </>
      )}
    </>
  );
}
