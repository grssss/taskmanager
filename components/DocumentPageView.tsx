"use client";

import { useState } from "react";
import { WorkspaceState, Page, ContentBlock } from "@/lib/types";
import { updatePage } from "@/lib/pageUtils";
import { FileText } from "lucide-react";

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

  const handleTitleSave = () => {
    if (title.trim() && title !== page.title) {
      const newState = updatePage(workspaceState, page.id, { title: title.trim() });
      onStateChange(newState);
    } else {
      setTitle(page.title);
    }
    setIsEditingTitle(false);
  };

  // For Phase 1, render content blocks as simple text
  // Phase 2 will add rich text editor (Tiptap)
  const renderBlock = (block: ContentBlock, index: number) => {
    const content = typeof block.content === "string" ? block.content : JSON.stringify(block.content);

    switch (block.type) {
      case "heading1":
        return (
          <h1 key={block.id} className="text-3xl font-bold mb-4 mt-8 first:mt-0">
            {content}
          </h1>
        );
      case "heading2":
        return (
          <h2 key={block.id} className="text-2xl font-bold mb-3 mt-6 first:mt-0">
            {content}
          </h2>
        );
      case "heading3":
        return (
          <h3 key={block.id} className="text-xl font-bold mb-2 mt-4 first:mt-0">
            {content}
          </h3>
        );
      case "paragraph":
        return (
          <p key={block.id} className="mb-4 text-zinc-700 dark:text-zinc-300 leading-relaxed">
            {content || <span className="text-zinc-400 italic">Empty paragraph</span>}
          </p>
        );
      case "quote":
        return (
          <blockquote
            key={block.id}
            className="border-l-4 border-zinc-300 dark:border-zinc-700 pl-4 py-2 mb-4 italic text-zinc-600 dark:text-zinc-400"
          >
            {content}
          </blockquote>
        );
      case "divider":
        return <hr key={block.id} className="my-6 border-t border-zinc-200 dark:border-zinc-800" />;
      case "code":
        return (
          <pre key={block.id} className="bg-zinc-100 dark:bg-zinc-900 rounded-lg p-4 mb-4 overflow-x-auto">
            <code className="text-sm font-mono text-zinc-800 dark:text-zinc-200">
              {content}
            </code>
          </pre>
        );
      default:
        return (
          <div key={block.id} className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Unsupported block type: {block.type}
            </p>
            <pre className="text-xs mt-2 text-zinc-600 dark:text-zinc-400">
              {content}
            </pre>
          </div>
        );
    }
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
      <div className="prose prose-zinc dark:prose-invert max-w-none">
        {page.content && page.content.length > 0 ? (
          page.content.map((block, index) => renderBlock(block, index))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText size={48} className="text-zinc-300 dark:text-zinc-700 mb-4" />
            <p className="text-zinc-500 dark:text-zinc-400 mb-2">
              This page is empty
            </p>
            <p className="text-sm text-zinc-400 dark:text-zinc-500">
              Rich text editor coming in Phase 2!
            </p>
          </div>
        )}
      </div>

      {/* Phase 2 Notice */}
      {page.content && page.content.length > 0 && (
        <div className="mt-12 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Note:</strong> This is a read-only view for Phase 1.
            Rich text editing with Tiptap will be added in Phase 2!
          </p>
        </div>
      )}
    </div>
  );
}
