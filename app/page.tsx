"use client";
import { useState, useEffect, useMemo } from "react";
import AuthForm from "@/components/AuthForm";
import WorkspaceSwitcher from "@/components/WorkspaceSwitcher";
import Sidebar from "@/components/Sidebar";
import PageCanvas from "@/components/PageCanvas";
import WorkspaceDebugPanel from "@/components/WorkspaceDebugPanel";
import MobileBottomNav from "@/components/MobileBottomNav";
import MobileTopBar from "@/components/MobileTopBar";
import MobileHome from "@/components/MobileHome";
import MobileSearch from "@/components/MobileSearch";
import MobileNewPage from "@/components/MobileNewPage";
import { useAuth } from "@/lib/AuthContext";
import { useWorkspaceStorage } from "@/lib/useWorkspaceStorage";
import { getRootPages } from "@/lib/types";
import {
  addWorkspaceToState,
  updateWorkspaceInState,
  type WorkspaceInput,
  type WorkspaceUpdateInput,
} from "@/lib/workspaceUtils";
import { createPage, addPageToState } from "@/lib/pageUtils";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [workspaceState, setWorkspaceState, storageLoading, syncStatus, historyActions] = useWorkspaceStorage();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isClient] = useState(true);
  const [mobileView, setMobileView] = useState<'home' | 'search' | 'new' | 'page'>('home');

  // Detect mobile
  useEffect(() => {
    if (!isClient) return;
    const checkMobile = () => {
      if (typeof window === 'undefined') return;
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [isClient]);

  // Global keyboard shortcuts for undo, redo, and save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z or Cmd+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        if (historyActions.canUndo) {
          e.preventDefault();
          historyActions.undo();
        }
      }
      // Ctrl+Y or Cmd+Shift+Z for redo
      else if (
        ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')
      ) {
        if (historyActions.canRedo) {
          e.preventDefault();
          historyActions.redo();
        }
      }
      // Ctrl+S or Cmd+S for manual save
      else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        historyActions.saveNow();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [historyActions]);

  const handlePageSelect = (pageId: string) => {
    setWorkspaceState((prev) => ({
      ...prev,
      activePageId: pageId,
    }));
    if (isMobile) {
      setMobileView('page');
    }
  };

  const handleWorkspaceChange = (workspaceId: string) => {
    setWorkspaceState((prev) => {
      const rootBoards = getRootPages(prev.pages, workspaceId).filter(
        (page) => page.type === "database"
      );

      if (rootBoards.length > 0) {
        return {
          ...prev,
          activeWorkspaceId: workspaceId,
          activePageId: rootBoards[0].id,
        };
      }

      const newBoard = createPage(workspaceId, "New Board");
      const updatedState = addPageToState(prev, newBoard);

      return {
        ...updatedState,
        activeWorkspaceId: workspaceId,
        activePageId: newBoard.id,
      };
    });
  };

  const handleWorkspaceCreate = (input: WorkspaceInput) => {
    setWorkspaceState((prev) => addWorkspaceToState(prev, input));
  };

  const handleWorkspaceEdit = (workspaceId: string, updates: WorkspaceUpdateInput) => {
    setWorkspaceState((prev) => updateWorkspaceInState(prev, workspaceId, updates));
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

  // Ensure the active selection is always a board
  const rootBoards = useMemo(
    () =>
      getRootPages(workspaceState.pages, workspaceState.activeWorkspaceId).filter(
        (page) => page.type === "database"
      ),
    [workspaceState.pages, workspaceState.activeWorkspaceId]
  );

  useEffect(() => {
    if (authLoading || storageLoading || !user) {
      return;
    }

    const activePage =
      workspaceState.activePageId
        ? workspaceState.pages[workspaceState.activePageId]
        : undefined;

    if (activePage && activePage.type === "database") {
      return;
    }

    if (rootBoards.length > 0) {
      if (rootBoards[0].id === workspaceState.activePageId) {
        return;
      }
      setWorkspaceState((prev) => ({
        ...prev,
        activePageId: rootBoards[0].id,
      }));
      return;
    }

    const newBoard = createPage(
      workspaceState.activeWorkspaceId,
      "New Board"
    );
    setWorkspaceState((prev) => {
      const updatedState = addPageToState(prev, newBoard);
      return {
        ...updatedState,
        activePageId: newBoard.id,
      };
    });
  }, [
    authLoading,
    storageLoading,
    user,
    workspaceState.activePageId,
    workspaceState.activeWorkspaceId,
    workspaceState.pages,
    rootBoards,
    setWorkspaceState,
  ]);

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

  // Check if there are any boards to render
  const hasNoBoardsInSidebar =
    rootBoards.length === 0 && Object.keys(workspaceState.pages).length > 0;
  const mobileMainClass = isClient && isMobile ? "flex-1 flex flex-col pt-14" : "flex-1 flex overflow-hidden";

  return (
    <div className="h-screen flex overflow-hidden bg-zinc-950">
      {/* Desktop: Sidebar */}
      {!isMobile && (
        <Sidebar
          workspaceState={workspaceState}
          onStateChange={setWorkspaceState}
          onPageSelect={handlePageSelect}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          mobileOpen={false}
          onMobileClose={() => {}}
          workspaceSwitcherSlot={
            <WorkspaceSwitcher
              workspaceState={workspaceState}
              onWorkspaceChange={handleWorkspaceChange}
              onWorkspaceCreate={handleWorkspaceCreate}
              onWorkspaceEdit={handleWorkspaceEdit}
            />
          }
        />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile: Show top bar */}
        {isClient && isMobile && (
          <MobileTopBar workspaceState={workspaceState} />
        )}

        <div className={mobileMainClass}>
          {isClient && isMobile ? (
            <>
              {mobileView === 'home' && (
                <MobileHome
                  workspaceState={workspaceState}
                  onPageSelect={handlePageSelect}
                />
              )}
              {mobileView === 'search' && (
                <MobileSearch
                  workspaceState={workspaceState}
                  onPageSelect={handlePageSelect}
                  onClose={() => setMobileView('home')}
                />
              )}
              {mobileView === 'new' && (
                <MobileNewPage
                  workspaceState={workspaceState}
                  onStateChange={setWorkspaceState}
                  onPageSelect={handlePageSelect}
                  onClose={() => setMobileView('home')}
                />
              )}
              {mobileView === 'page' && (
                <PageCanvas
                  workspaceState={workspaceState}
                  onStateChange={setWorkspaceState}
                  onPageSelect={handlePageSelect}
                  onBackClick={() => setMobileView('home')}
                />
              )}
            </>
          ) : (
            <PageCanvas
              workspaceState={workspaceState}
              onStateChange={setWorkspaceState}
              onPageSelect={handlePageSelect}
            />
          )}
        </div>

        {/* Mobile: Bottom navigation */}
        {isClient && isMobile && (
          <MobileBottomNav
            onPagesClick={() => setMobileView('home')}
            onSearchClick={() => setMobileView('search')}
            onNewPageClick={() => setMobileView('new')}
            activeTab={
              mobileView === 'home' ? 'pages' :
              mobileView === 'search' ? 'search' :
              mobileView === 'new' ? 'new' :
              undefined
            }
          />
        )}
      </div>

      {/* Migration notice */}
      {syncStatus.migrated && (
        <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
          Your data has been migrated to the new workspace system!
        </div>
      )}

      {/* Debug Panel - Only show for specific account and not on mobile */}
      {!isMobile && user.email === 'temppookerrr2@gmail.com' && (
        <WorkspaceDebugPanel
          workspaceState={workspaceState}
          onFix={handleFixData}
        />
      )}

      {/* Warning if no boards in sidebar - Only on desktop */}
      {!isMobile && hasNoBoardsInSidebar && (
        <div className="fixed top-20 right-4 bg-blue-500 text-white px-4 py-3 rounded-lg shadow-lg max-w-md">
          <div className="font-bold">No Boards Yet</div>
          <div className="text-sm mt-1">
            Create a new board with the “+” button in the sidebar to get started.
          </div>
        </div>
      )}
    </div>
  );
}
