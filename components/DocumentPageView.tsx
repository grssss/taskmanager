"use client";

import { useState, useEffect } from "react";
import { WorkspaceState, Page, ContentBlock, ContentBlockType } from "@/lib/types";
import { updatePage } from "@/lib/pageUtils";
import { Plus, ArrowLeft, Share2, MoreHorizontal } from "lucide-react";
import EditableBlock from "./EditableBlock";
import MobileBlockToolbar from "./MobileBlockToolbar";

interface DocumentPageViewProps {
  page: Page & { content: ContentBlock[] };
  workspaceState: WorkspaceState;
  onStateChange: (state: WorkspaceState) => void;
  onEditingChange?: (isEditing: boolean) => void;
  onBackClick?: () => void;
}

export default function DocumentPageView({
  page,
  workspaceState,
  onStateChange,
  onEditingChange,
  onBackClick,
}: DocumentPageViewProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(page.title);
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      if (typeof window === 'undefined') return;
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Notify parent when editing state changes
  useEffect(() => {
    if (isMobile && onEditingChange) {
      onEditingChange(showToolbar || isEditingTitle);
    }
  }, [showToolbar, isEditingTitle, isMobile, onEditingChange]);

  // Sync title state when page changes
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setTitle(page.title);
      // Auto-enable editing for new "Untitled" pages
      setIsEditingTitle(page.title === "Untitled");
    });
    return () => cancelAnimationFrame(frame);
  }, [page.id, page.title]);

  const handleTitleSave = () => {
    if (title.trim() && title !== page.title) {
      const newState = updatePage(workspaceState, page.id, { title: title.trim() });
      onStateChange(newState);
    } else {
      setTitle(page.title);
    }
    setIsEditingTitle(false);
  };

  // Block management functions
  const createBlock = (type: ContentBlockType = "paragraph", content: string = ""): ContentBlock => {
    return {
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const handleBlockUpdate = (blockId: string, content: string) => {
    const updatedContent = (page.content || []).map((block) =>
      block.id === blockId
        ? { ...block, content, updatedAt: new Date().toISOString() }
        : block
    );
    const newState = updatePage(workspaceState, page.id, { content: updatedContent });
    onStateChange(newState);
  };

  const handleMetadataUpdate = (blockId: string, metadata: Record<string, unknown>) => {
    const updatedContent = (page.content || []).map((block) =>
      block.id === blockId
        ? { ...block, metadata, updatedAt: new Date().toISOString() }
        : block
    );
    const newState = updatePage(workspaceState, page.id, { content: updatedContent });
    onStateChange(newState);
  };

  const handleBlockCreate = (afterBlockId: string, type: ContentBlockType) => {
    const newBlock = createBlock(type);
    const currentContent = page.content || [];
    const insertIndex = currentContent.findIndex((b) => b.id === afterBlockId);

    const updatedContent = [
      ...currentContent.slice(0, insertIndex + 1),
      newBlock,
      ...currentContent.slice(insertIndex + 1),
    ];

    const newState = updatePage(workspaceState, page.id, { content: updatedContent });
    onStateChange(newState);

    // Focus the new block after a short delay
    setTimeout(() => setFocusedBlockId(newBlock.id), 10);
  };

  const handleBlockDelete = (blockId: string) => {
    const updatedContent = (page.content || []).filter((block) => block.id !== blockId);
    const newState = updatePage(workspaceState, page.id, { content: updatedContent });
    onStateChange(newState);
  };

  const handleBlockMerge = (blockId: string) => {
    const currentContent = page.content || [];
    const blockIndex = currentContent.findIndex((b) => b.id === blockId);

    if (blockIndex > 0) {
      const currentBlock = currentContent[blockIndex];
      const previousBlock = currentContent[blockIndex - 1];

      // Merge content into previous block
      const mergedContent =
        (typeof previousBlock.content === "string" ? previousBlock.content : "") +
        (typeof currentBlock.content === "string" ? currentBlock.content : "");

      const updatedContent = currentContent
        .map((block, index) => {
          if (index === blockIndex - 1) {
            return { ...block, content: mergedContent, updatedAt: new Date().toISOString() };
          }
          return block;
        })
        .filter((_, index) => index !== blockIndex);

      const newState = updatePage(workspaceState, page.id, { content: updatedContent });
      onStateChange(newState);

      // Focus the previous block after merge
      setTimeout(() => setFocusedBlockId(previousBlock.id), 10);
    }
  };

  const handleBlockMergeWithNext = (blockId: string) => {
    const currentContent = page.content || [];
    const blockIndex = currentContent.findIndex((b) => b.id === blockId);

    if (blockIndex < currentContent.length - 1) {
      const currentBlock = currentContent[blockIndex];
      const nextBlock = currentContent[blockIndex + 1];

      // Merge next block's content into current block
      const mergedContent =
        (typeof currentBlock.content === "string" ? currentBlock.content : "") +
        (typeof nextBlock.content === "string" ? nextBlock.content : "");

      const updatedContent = currentContent
        .map((block, index) => {
          if (index === blockIndex) {
            return { ...block, content: mergedContent, updatedAt: new Date().toISOString() };
          }
          return block;
        })
        .filter((_, index) => index !== blockIndex + 1);

      const newState = updatePage(workspaceState, page.id, { content: updatedContent });
      onStateChange(newState);

      // Keep focus on current block after merge
      setTimeout(() => setFocusedBlockId(currentBlock.id), 10);
    }
  };

  const handleBlockTypeChange = (blockId: string, newType: ContentBlockType) => {
    const updatedContent = (page.content || []).map((block) =>
      block.id === blockId
        ? { ...block, type: newType, updatedAt: new Date().toISOString() }
        : block
    );
    const newState = updatePage(workspaceState, page.id, { content: updatedContent });
    onStateChange(newState);

    // Re-focus the block after type change (double setTimeout ensures DOM updates complete)
    setTimeout(() => {
      setTimeout(() => setFocusedBlockId(blockId), 0);
    }, 0);
  };

  const handleAddFirstBlock = () => {
    const newBlock = createBlock("paragraph");
    const newState = updatePage(workspaceState, page.id, { content: [newBlock] });
    onStateChange(newState);
    setTimeout(() => setFocusedBlockId(newBlock.id), 10);
  };

  const pageUrl =
    typeof window !== "undefined" ? window.location.href : "";

  const handleCopyLink = async () => {
    const nav = typeof navigator !== "undefined" ? navigator : undefined;
    if (nav?.clipboard) {
      try {
        await nav.clipboard.writeText(pageUrl);
      } catch (error) {
        console.warn("Failed to copy link", error);
      }
    }
  };

  const handleShare = async () => {
    const nav =
      typeof navigator !== "undefined"
        ? (navigator as Navigator & { share?: (data: ShareData) => Promise<void> })
        : undefined;
    try {
      if (nav?.share) {
        await nav.share({
          title: page.title,
          text: page.title,
          url: pageUrl,
        });
      } else {
        await handleCopyLink();
      }
    } catch (error) {
      console.warn("Share cancelled or failed", error);
    }
  };

  const mobileChromeHeight = 72;
  const mobileTopPadding = isMobile
    ? `calc(env(safe-area-inset-top, 0px) + ${mobileChromeHeight}px)`
    : undefined;

  return (
    <div
      className={`mx-auto max-w-3xl ${isMobile ? "px-4" : "px-6 py-8"} ${
        showToolbar ? "pb-32" : ""
      }`}
      style={isMobile ? { paddingTop: mobileTopPadding } : undefined}
    >
      {/* Mobile floating controls */}
      {isMobile && (
        <>
          <div
            className="pointer-events-none fixed left-0 right-0 z-30"
            style={{
              top: 0,
              height: "calc(env(safe-area-inset-top, 0px) + 72px)",
              background:
                "linear-gradient(180deg, rgba(12,12,12,0.95) 0%, rgba(12,12,12,0.8) 60%, rgba(12,12,12,0) 100%)",
            }}
          />
          <div
            className="fixed left-4 right-4 z-40 flex items-center justify-between"
            style={{
              top: "calc(env(safe-area-inset-top, 0px) + 10px)",
            }}
          >
            <button
              onClick={() => onBackClick?.()}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur"
              >
                <Share2 size={18} />
              </button>
              <button
                onClick={() => setShowOptionsMenu(true)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur"
              >
                <MoreHorizontal size={18} />
              </button>
            </div>
          </div>

          {showOptionsMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowOptionsMenu(false)}
              />
              <div
                className="fixed right-4 z-50 w-48 rounded-2xl border border-white/10 bg-zinc-900/95 text-sm text-zinc-100 shadow-2xl backdrop-blur"
                style={{
                  top: "calc(env(safe-area-inset-top, 0px) + 60px)",
                }}
              >
                <button
                  className="w-full px-4 py-3 text-left hover:bg-white/5 transition"
                  onClick={() => {
                    console.log("Add to favorites");
                    setShowOptionsMenu(false);
                  }}
                >
                  Add to favorites
                </button>
                <button
                  className="w-full px-4 py-3 text-left hover:bg-white/5 transition"
                  onClick={() => {
                    handleCopyLink();
                    setShowOptionsMenu(false);
                  }}
                >
                  Copy link
                </button>
                <button
                  className="w-full px-4 py-3 text-left text-red-400 hover:bg-red-500/10 transition"
                  onClick={() => {
                    console.log("Move to trash");
                    setShowOptionsMenu(false);
                  }}
                >
                  Move to trash
                </button>
              </div>
            </>
          )}
        </>
      )}
      {/* Page Icon & Title - Simplified for mobile */}
      <div className={isMobile ? 'mb-4' : 'mb-8'}>

        {isEditingTitle ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleTitleSave();
              if (e.key === "Escape") {
                setTitle(page.title);
                setIsEditingTitle(false);
              }
            }}
            onFocus={(e) => {
              e.target.select();
              if (isMobile) setShowToolbar(false);
            }}
            autoFocus
            className={`w-full ${isMobile ? 'text-2xl' : 'text-4xl'} font-bold bg-transparent border-none outline-none focus:ring-0 text-zinc-100 placeholder-zinc-400`}
            placeholder="Untitled"
          />
        ) : (
          <h1
            onClick={() => setIsEditingTitle(true)}
            className={`${isMobile ? 'text-2xl' : 'text-4xl'} font-bold mb-2 cursor-pointer hover:bg-zinc-800 rounded px-2 -mx-2 py-1 transition-colors text-zinc-100`}
          >
            {page.title}
          </h1>
        )}
      </div>

      {/* Content Blocks */}
      <div className={`max-w-none ${isMobile ? 'pl-0' : 'pl-6'}`}>
        {page.content && page.content.length > 0 ? (
          page.content.map((block, index) => (
            <EditableBlock
              key={block.id}
              block={block}
              blockIndex={index}
              allBlocks={page.content}
              onUpdate={handleBlockUpdate}
              onMetadataUpdate={handleMetadataUpdate}
              onDelete={handleBlockDelete}
              onCreate={handleBlockCreate}
              onMergeWithPrevious={handleBlockMerge}
              onMergeWithNext={handleBlockMergeWithNext}
              onTypeChange={handleBlockTypeChange}
              onFocus={(blockId) => {
                setFocusedBlockId(blockId);
                if (isMobile) setShowToolbar(true);
              }}
              shouldFocus={focusedBlockId === block.id}
              previousBlockId={index > 0 ? page.content[index - 1].id : undefined}
              nextBlockId={index < page.content.length - 1 ? page.content[index + 1].id : undefined}
              isFirst={index === 0}
              isLast={index === page.content.length - 1}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Plus size={48} className="text-zinc-300 dark:text-zinc-700 mb-4" />
            <p className="text-zinc-400 mb-4">
              This page is empty
            </p>
            <button
              onClick={handleAddFirstBlock}
              className="px-4 py-2 bg-zinc-700 dark:bg-zinc-700 text-zinc-200 rounded-lg hover:bg-zinc-600 dark:hover:bg-zinc-600 transition-colors"
            >
              Add your first block
            </button>
          </div>
        )}
      </div>

      {/* Mobile Block Toolbar */}
      {isMobile && showToolbar && focusedBlockId && (
        <MobileBlockToolbar
          onBlockTypeSelect={(type) => {
            handleBlockTypeChange(focusedBlockId, type);
            setShowToolbar(false);
          }}
          onAddBlock={() => {
            handleBlockCreate(focusedBlockId, "paragraph");
            setShowToolbar(false);
          }}
          onClose={() => setShowToolbar(false)}
        />
      )}
    </div>
  );
}
