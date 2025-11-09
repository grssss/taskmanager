"use client";
import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import AuthForm from "@/components/AuthForm";
import UserProfile from "@/components/UserProfile";
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

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [workspaceState, setWorkspaceState, storageLoading, syncStatus, historyActions] = useWorkspaceStorage();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [mobileView, setMobileView] = useState<'home' | 'search' | 'new' | 'page'>('home');
  const [isEditingDocument, setIsEditingDocument] = useState(false);

  // Ensure client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

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
    // Close mobile menu when selecting a page
    if (isMobile) {
      setMobileMenuOpen(false);
      setMobileView('page');
    }
  };

  const handleWorkspaceChange = (workspaceId: string) => {
    const rootPages = getRootPages(workspaceState.pages, workspaceId);
    setWorkspaceState({
      ...workspaceState,
      activeWorkspaceId: workspaceId,
      activePageId: rootPages[0]?.id,
    });
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
      {/* Desktop: Show UserProfile in top-left */}
      {!isMobile && <UserProfile />}

      {/* Mobile: Show Notion-style top bar */}
      {isClient && isMobile && !isEditingDocument && (
        <MobileTopBar
          workspaceState={workspaceState}
          onWorkspaceChange={handleWorkspaceChange}
        />
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop: Always show sidebar */}
        {!isMobile && (
          <Sidebar
            workspaceState={workspaceState}
            onStateChange={setWorkspaceState}
            onPageSelect={handlePageSelect}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            mobileOpen={false}
            onMobileClose={() => {}}
          />
        )}

        {/* Mobile: Show different views based on mobileView state */}
        {isClient && isMobile ? (
          <div className="flex-1 flex flex-col pt-14">
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
                onEditingChange={setIsEditingDocument}
              />
            )}
          </div>
        ) : (
          /* Desktop: Show PageCanvas */
          <PageCanvas
            workspaceState={workspaceState}
            onStateChange={setWorkspaceState}
            onPageSelect={handlePageSelect}
          />
        )}
      </div>

      {/* Mobile: Bottom navigation - Hide when editing document */}
      {isClient && isMobile && !isEditingDocument && (
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

      {/* Migration notice */}
      {syncStatus.migrated && (
        <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
          ✅ Your data has been migrated to the new workspace system!
        </div>
      )}

      {/* Debug Panel - Only show for specific account and not on mobile */}
      {!isMobile && user.email === 'temppookerrr2@gmail.com' && (
        <WorkspaceDebugPanel
          workspaceState={workspaceState}
          onFix={handleFixData}
        />
      )}

      {/* Warning if no pages in sidebar - Only on desktop */}
      {!isMobile && hasNoPagesInSidebar && (
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
