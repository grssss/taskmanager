"use client";

import { useState } from "react";
import {
  Plus,
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Image,
  Link,
  Code,
  Quote,
  AlignLeft,
  X,
} from "lucide-react";
import { ContentBlockType } from "@/lib/types";
import { useVisualViewportHeight } from "@/lib/useKeyboardHeight";

interface MobileBlockToolbarProps {
  onBlockTypeSelect: (type: ContentBlockType) => void;
  onAddBlock: () => void;
  onClose: () => void;
}

export default function MobileBlockToolbar({
  onBlockTypeSelect,
  onAddBlock,
  onClose,
}: MobileBlockToolbarProps) {
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const viewportHeight = useVisualViewportHeight();

  const blockTypes = [
    { type: "paragraph" as ContentBlockType, label: "Text", icon: Type },
    { type: "heading1" as ContentBlockType, label: "Heading 1", icon: Heading1 },
    { type: "heading2" as ContentBlockType, label: "Heading 2", icon: Heading2 },
    { type: "heading3" as ContentBlockType, label: "Heading 3", icon: Heading3 },
    { type: "bulletList" as ContentBlockType, label: "Bulleted list", icon: List },
    { type: "numberedList" as ContentBlockType, label: "Numbered list", icon: ListOrdered },
    { type: "todo" as ContentBlockType, label: "To-do list", icon: CheckSquare },
  ];

  return (
    <>
      {/* Block type menu overlay */}
      {showBlockMenu && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowBlockMenu(false)}
          />
          <div
            className="fixed left-0 right-0 z-50 bg-zinc-900 border-t border-white/10 max-h-96 overflow-y-auto"
            style={{
              top: `${viewportHeight}px`,
              transform: 'translateY(calc(-100% - 40px))',
            }}
          >
            <div className="p-2 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xs font-medium text-zinc-400 uppercase">Basic blocks</h3>
              <button
                onClick={() => setShowBlockMenu(false)}
                className="p-1 text-zinc-400 hover:text-zinc-100"
              >
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 p-2">
              {blockTypes.map((blockType) => {
                const Icon = blockType.icon;
                return (
                  <button
                    key={blockType.type}
                    onClick={() => {
                      onBlockTypeSelect(blockType.type);
                      setShowBlockMenu(false);
                    }}
                    className="flex items-center gap-2 p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-left"
                  >
                    <Icon size={16} className="text-zinc-400" />
                    <span className="text-xs text-zinc-100">{blockType.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Main toolbar - Position above keyboard using Visual Viewport */}
      <div
        className="fixed left-0 right-0 z-30 bg-zinc-900 border-t border-white/10"
        style={{
          top: `${viewportHeight}px`,
          transform: 'translateY(-100%)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="flex items-center gap-1.5 px-2 py-1.5 overflow-x-auto scrollbar-hide">
          {/* Add block button */}
          <button
            onClick={onAddBlock}
            className="flex items-center justify-center gap-1 min-w-[50px] px-2 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 transition-colors"
          >
            <Plus size={16} className="text-zinc-400" />
            <span className="text-[10px] text-zinc-400">Add</span>
          </button>

          {/* Text formatting button */}
          <button
            onClick={() => setShowBlockMenu(true)}
            className="flex items-center justify-center gap-1 min-w-[50px] px-2 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 transition-colors"
          >
            <AlignLeft size={16} className="text-zinc-400" />
            <span className="text-[10px] text-zinc-400">Type</span>
          </button>

          {/* Image placeholder */}
          <button
            className="flex items-center justify-center gap-1 min-w-[50px] px-2 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 transition-colors opacity-50"
            disabled
          >
            <Image size={16} className="text-zinc-400" />
            <span className="text-[10px] text-zinc-400">Media</span>
          </button>

          {/* Link placeholder */}
          <button
            className="flex items-center justify-center gap-1 min-w-[50px] px-2 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 transition-colors opacity-50"
            disabled
          >
            <Link size={16} className="text-zinc-400" />
            <span className="text-[10px] text-zinc-400">Link</span>
          </button>

          {/* Code placeholder */}
          <button
            className="flex items-center justify-center gap-1 min-w-[50px] px-2 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 transition-colors opacity-50"
            disabled
          >
            <Code size={16} className="text-zinc-400" />
            <span className="text-[10px] text-zinc-400">Code</span>
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            className="flex items-center justify-center gap-1 min-w-[50px] px-2 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 transition-colors ml-auto"
          >
            <X size={16} className="text-zinc-400" />
            <span className="text-[10px] text-zinc-400">Close</span>
          </button>
        </div>
      </div>
    </>
  );
}
