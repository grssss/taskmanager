"use client";
import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import AuthForm from "@/components/AuthForm";
import UserProfile from "@/components/UserProfile";
import Sidebar from "@/components/Sidebar";
import PageCanvas from "@/components/PageCanvas";
import WorkspaceDebugPanel from "@/components/WorkspaceDebugPanel";
import { useAuth } from "@/lib/AuthContext";
import { useWorkspaceStorage } from "@/lib/useWorkspaceStorage";
import { getRootPages } from "@/lib/types";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [workspaceState, setWorkspaceState, storageLoading, syncStatus] = useWorkspaceStorage();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Start collapsed on mobile

  // Detect screen size and set initial sidebar state
  useEffect(() => {
    const handleResize = () => {
      // On desktop (>= 768px), show sidebar by default
      if (window.innerWidth >= 768) {
        setSidebarCollapsed(false);
      } else {
        // On mobile, keep collapsed
        setSidebarCollapsed(true);
      }
    };

    // Set initial state
    handleResize();

    // Listen for resize events
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (authLoading || storageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">
            {authLoading ? "Loading..." : "Loading your workspace..."}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  const handlePageSelect = (pageId: string) => {
    setWorkspaceState((prev) => ({
      ...prev,
      activePageId: pageId,
    }));
  };

  const handleFixData = () => {
    setWorkspaceState((prev) => {
      const { activeWorkspaceId, pages } = prev;
      const fixedPages: typeof pages = {};

      // Fix all pages to have the correct workspaceId
      Object.entries(pages).forEach(([id, page]) => {
        fixedPages[id] = {
          ...page,
          workspaceId: activeWorkspaceId, // Force all pages to use active workspace
          parentPageId: undefined, // Make all pages root level
        };
      });

      console.log('Fixed pages:', fixedPages);
      return { ...prev, pages: fixedPages };
    });
  };

  // Check if there's a problem with the sidebar
  const rootPages = getRootPages(workspaceState.pages, workspaceState.activeWorkspaceId);
  const hasNoPagesInSidebar = rootPages.length === 0 && Object.keys(workspaceState.pages).length > 0;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <UserProfile />
      <div className="flex-1 flex overflow-hidden relative">
        {/* Hamburger menu button for mobile */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={`md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-zinc-800 border border-black/10 dark:border-white/10 shadow-lg transition-opacity ${
            sidebarCollapsed ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          title="Open sidebar"
        >
          <Menu size={20} />
        </button>

        <Sidebar
          workspaceState={workspaceState}
          onStateChange={setWorkspaceState}
          onPageSelect={handlePageSelect}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <PageCanvas
          workspaceState={workspaceState}
          onStateChange={setWorkspaceState}
          onPageSelect={handlePageSelect}
        />
      </div>

      {/* Migration notice */}
      {syncStatus.migrated && (
        <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
          ✅ Your data has been migrated to the new workspace system!
        </div>
      )}

      {/* Debug Panel - Always show for now to help debug */}
      <WorkspaceDebugPanel
        workspaceState={workspaceState}
        onFix={handleFixData}
      />

      {/* Warning if no pages in sidebar */}
      {hasNoPagesInSidebar && (
        <div className="fixed top-20 right-4 bg-orange-500 text-white px-4 py-3 rounded-lg shadow-lg max-w-md">
          <div className="font-bold">⚠️ Projects Not Showing</div>
          <div className="text-sm mt-1">
            Your projects exist but aren't appearing in the sidebar. Click the "🔧 Debug Data" button to inspect and fix.
          </div>
        </div>
      )}
    </div>
  );
}
