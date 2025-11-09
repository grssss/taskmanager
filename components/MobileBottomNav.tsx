"use client";

import { Home, Search, FileText, PlusCircle } from "lucide-react";

interface MobileBottomNavProps {
  onPagesClick: () => void;
  onSearchClick: () => void;
  onNewPageClick: () => void;
  activeTab?: 'pages' | 'search' | 'new';
}

export default function MobileBottomNav({
  onPagesClick,
  onSearchClick,
  onNewPageClick,
  activeTab,
}: MobileBottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-900 border-t border-white/10 pb-safe">
      <div className="flex items-center justify-around h-16 px-4">
        {/* Pages/Home */}
        <button
          onClick={onPagesClick}
          className={`flex flex-col items-center justify-center gap-1 min-w-[60px] transition-colors ${
            activeTab === 'pages' ? 'text-white' : 'text-zinc-400'
          }`}
        >
          <Home size={24} strokeWidth={activeTab === 'pages' ? 2 : 1.5} />
          <span className="text-xs font-medium">Home</span>
        </button>

        {/* Search */}
        <button
          onClick={onSearchClick}
          className={`flex flex-col items-center justify-center gap-1 min-w-[60px] transition-colors ${
            activeTab === 'search' ? 'text-white' : 'text-zinc-400'
          }`}
        >
          <Search size={24} strokeWidth={activeTab === 'search' ? 2 : 1.5} />
          <span className="text-xs font-medium">Search</span>
        </button>

        {/* Placeholder (Inbox/Updates) */}
        <button
          className="flex flex-col items-center justify-center gap-1 min-w-[60px] text-zinc-400 transition-colors"
          disabled
        >
          <FileText size={24} strokeWidth={1.5} />
          <span className="text-xs font-medium">Updates</span>
        </button>

        {/* New Page */}
        <button
          onClick={onNewPageClick}
          className={`flex flex-col items-center justify-center gap-1 min-w-[60px] transition-colors ${
            activeTab === 'new' ? 'text-white' : 'text-zinc-400'
          }`}
        >
          <PlusCircle size={24} strokeWidth={activeTab === 'new' ? 2 : 1.5} />
          <span className="text-xs font-medium">New</span>
        </button>
      </div>
    </div>
  );
}
