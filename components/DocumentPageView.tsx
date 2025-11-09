"use client";

import { useState } from "react";
import { WorkspaceState, Page, ContentBlock, ContentBlockType } from "@/lib/types";
import { updatePage } from "@/lib/pageUtils";
import { Plus } from "lucide-react";
import EditableBlock from "./EditableBlock";

interface DocumentPageViewProps {
  page: Page & { content: ContentBlock[] };
  workspaceState: WorkspaceState;
  onStateChange: (state: WorkspaceState) => void;
}

export default function DocumentPageView({
  page,
  workspaceState,
  onStateChange,
}: DocumentPageViewProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(page.title);
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);

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
  };

  const handleAddFirstBlock = () => {
    const newBlock = createBlock("paragraph");
    const newState = updatePage(workspaceState, page.id, { content: [newBlock] });
    onStateChange(newState);
    setTimeout(() => setFocusedBlockId(newBlock.id), 10);
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      {/* Page Icon & Title */}
      <div className="mb-8">
        {page.icon && (
          <div className="text-6xl mb-4">
            {page.icon}
          </div>
        )}

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
            autoFocus
            className="w-full text-4xl font-bold bg-transparent border-none outline-none focus:ring-0 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
            placeholder="Untitled"
          />
        ) : (
          <h1
            onClick={() => setIsEditingTitle(true)}
            className="text-4xl font-bold mb-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded px-2 -mx-2 py-1 transition-colors text-zinc-900 dark:text-zinc-100"
          >
            {page.title}
          </h1>
        )}
      </div>

      {/* Content Blocks */}
      <div className="max-w-none pl-6">
        {page.content && page.content.length > 0 ? (
          page.content.map((block, index) => (
            <EditableBlock
              key={block.id}
              block={block}
              onUpdate={handleBlockUpdate}
              onDelete={handleBlockDelete}
              onCreate={handleBlockCreate}
              onMergeWithPrevious={handleBlockMerge}
              onMergeWithNext={handleBlockMergeWithNext}
              onTypeChange={handleBlockTypeChange}
              onFocus={setFocusedBlockId}
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
            <p className="text-zinc-500 dark:text-zinc-400 mb-4">
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
    </div>
  );
}
