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
  ChevronRight,
  Image as ImageIcon,
  Camera,
  FolderOpen,
  Undo,
  Redo,
  Smile,
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
  const [showMediaMenu, setShowMediaMenu] = useState(false);
  const viewportHeight = useVisualViewportHeight();

  const blockTypes = [
    { type: "paragraph" as ContentBlockType, label: "Text", icon: Type },
    { type: "heading1" as ContentBlockType, label: "Heading 1", icon: Heading1 },
    { type: "heading2" as ContentBlockType, label: "Heading 2", icon: Heading2 },
    { type: "heading3" as ContentBlockType, label: "Heading 3", icon: Heading3 },
    { type: "bulletList" as ContentBlockType, label: "Bulleted list", icon: List },
    { type: "numberedList" as ContentBlockType, label: "Numbered list", icon: ListOrdered },
    { type: "todoList" as ContentBlockType, label: "To-do list", icon: CheckSquare },
    { type: "toggleList" as ContentBlockType, label: "Toggle list", icon: ChevronRight },
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
              transform: 'translateY(calc(-100% - 56px))',
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
                    className="flex items-center gap-2 p-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-left"
                  >
                    <Icon size={20} className="text-zinc-400" />
                    <span className="text-sm text-zinc-100">{blockType.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Media menu overlay */}
      {showMediaMenu && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowMediaMenu(false)}
          />
          <div
            className="fixed left-0 right-0 z-50 bg-zinc-900 border-t border-white/10"
            style={{
              top: `${viewportHeight}px`,
              transform: 'translateY(calc(-100% - 56px))',
            }}
          >
            <div className="p-2 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xs font-medium text-zinc-400 uppercase">Insert media</h3>
              <button
                onClick={() => setShowMediaMenu(false)}
                className="p-1 text-zinc-400 hover:text-zinc-100"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex flex-col gap-1 p-2">
              <button
                onClick={() => {
                  // Handle photo library
                  setShowMediaMenu(false);
                }}
                className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-left"
              >
                <ImageIcon size={20} className="text-zinc-400" />
                <span className="text-sm text-zinc-100">Photo library</span>
              </button>
              <button
                onClick={() => {
                  // Handle camera
                  setShowMediaMenu(false);
                }}
                className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-left"
              >
                <Camera size={20} className="text-zinc-400" />
                <span className="text-sm text-zinc-100">Take photo or video</span>
              </button>
              <button
                onClick={() => {
                  // Handle choose files
                  setShowMediaMenu(false);
                }}
                className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-left"
              >
                <FolderOpen size={20} className="text-zinc-400" />
                <span className="text-sm text-zinc-100">Choose files</span>
              </button>
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
        <div className="flex items-center gap-2 px-3 py-2.5 overflow-x-auto scrollbar-hide">
          {/* Text formatting icon */}
          <button
            onClick={() => setShowBlockMenu(true)}
            className="flex items-center justify-center w-10 h-10 rounded-md hover:bg-zinc-800 transition-colors flex-shrink-0"
          >
            <Type size={22} className="text-zinc-400" />
          </button>

          {/* Add block button */}
          <button
            onClick={onAddBlock}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors flex-shrink-0"
          >
            <Plus size={22} className="text-zinc-100" />
          </button>

          {/* Text formatting (Aa) */}
          <button
            className="flex items-center justify-center w-10 h-10 rounded-md hover:bg-zinc-800 transition-colors flex-shrink-0"
            onClick={() => {
              // Text formatting actions
            }}
          >
            <span className="text-zinc-400 font-semibold text-lg">Aa</span>
          </button>

          {/* Insert media button */}
          <button
            onClick={() => setShowMediaMenu(true)}
            className="flex items-center justify-center w-10 h-10 rounded-md hover:bg-zinc-800 transition-colors flex-shrink-0"
          >
            <ImageIcon size={22} className="text-zinc-400" />
          </button>

          {/* Image/Gallery */}
          <button
            className="flex items-center justify-center w-10 h-10 rounded-md hover:bg-zinc-800 transition-colors flex-shrink-0"
            onClick={() => {
              // Gallery action
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </button>

          {/* Undo button */}
          <button
            onClick={() => {
              // Handle undo
            }}
            className="flex items-center justify-center w-10 h-10 rounded-md hover:bg-zinc-800 transition-colors flex-shrink-0"
          >
            <Undo size={22} className="text-zinc-400" />
          </button>

          {/* Redo button */}
          <button
            onClick={() => {
              // Handle redo
            }}
            className="flex items-center justify-center w-10 h-10 rounded-md hover:bg-zinc-800 transition-colors flex-shrink-0"
          >
            <Redo size={22} className="text-zinc-400" />
          </button>

          {/* Emoji button */}
          <button
            onClick={() => {
              // Handle emoji picker
            }}
            className="flex items-center justify-center w-10 h-10 rounded-md hover:bg-zinc-800 transition-colors flex-shrink-0"
          >
            <Smile size={22} className="text-zinc-400" />
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 rounded-md hover:bg-zinc-800 transition-colors flex-shrink-0 ml-auto"
          >
            <X size={22} className="text-zinc-400" />
          </button>
        </div>
      </div>
    </>
  );
}
