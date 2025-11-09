"use client";
import { useState } from "react";
import AuthForm from "@/components/AuthForm";
import UserProfile from "@/components/UserProfile";
import Sidebar from "@/components/Sidebar";
import PageCanvas from "@/components/PageCanvas";
import { useAuth } from "@/lib/AuthContext";
import { useWorkspaceStorage } from "@/lib/useWorkspaceStorage";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [workspaceState, setWorkspaceState, storageLoading, syncStatus] = useWorkspaceStorage();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <UserProfile />
      <div className="flex-1 flex overflow-hidden">
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
    </div>
  );
}
