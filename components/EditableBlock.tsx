"use client";

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from "react";
import { ContentBlock, ContentBlockType } from "@/lib/types";
import { Check, GripVertical } from "lucide-react";

interface EditableBlockProps {
  block: ContentBlock;
  onUpdate: (blockId: string, content: string) => void;
  onDelete: (blockId: string) => void;
  onCreate: (afterBlockId: string, type: ContentBlockType) => void;
  onMergeWithPrevious: (blockId: string) => void;
  onMergeWithNext: (blockId: string) => void;
  onTypeChange: (blockId: string, newType: ContentBlockType) => void;
  onFocus?: (blockId: string) => void;
  shouldFocus?: boolean;
  previousBlockId?: string;
  nextBlockId?: string;
  isFirst: boolean;
  isLast: boolean;
}

export default function EditableBlock({
  block,
  onUpdate,
  onDelete,
  onCreate,
  onMergeWithPrevious,
  onMergeWithNext,
  onTypeChange,
  onFocus,
  shouldFocus = false,
  previousBlockId,
  nextBlockId,
  isFirst,
  isLast,
}: EditableBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuQuery, setSlashMenuQuery] = useState("");
  const [todoChecked, setTodoChecked] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const content = typeof block.content === "string" ? block.content : "";

  // Focus on the block when editing starts
  useEffect(() => {
    if (isEditing && contentRef.current) {
      contentRef.current.focus();
      // Move cursor to end
      const range = document.createRange();
      const sel = window.getSelection();
      if (contentRef.current.childNodes.length > 0) {
        const lastNode = contentRef.current.childNodes[contentRef.current.childNodes.length - 1];
        const offset = lastNode.textContent?.length || 0;
        range.setStart(lastNode, offset);
        range.collapse(true);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  }, [isEditing]);

  // Initialize content only when block changes (not on every render)
  useEffect(() => {
    if (contentRef.current && contentRef.current.innerText !== content) {
      contentRef.current.innerText = content;
    }
  }, [block.id, content]);

  // Focus block when shouldFocus prop changes to true
  useEffect(() => {
    if (shouldFocus && contentRef.current) {
      contentRef.current.focus();
      // Move cursor to end
      const range = document.createRange();
      const sel = window.getSelection();
      if (contentRef.current.childNodes.length > 0) {
        const lastNode = contentRef.current.childNodes[contentRef.current.childNodes.length - 1];
        const offset = lastNode.textContent?.length || 0;
        range.setStart(lastNode, offset);
        range.collapse(true);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  }, [shouldFocus]);

  const handleInput = () => {
    if (contentRef.current) {
      const newContent = contentRef.current.innerText;

      // Check for slash command at start
      if (newContent.startsWith("/") && newContent.length > 1) {
        setShowSlashMenu(true);
        setSlashMenuQuery(newContent.slice(1).toLowerCase());
      } else {
        setShowSlashMenu(false);
        setSlashMenuQuery("");
      }

      onUpdate(block.id, newContent);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const cursorAtStart = window.getSelection()?.anchorOffset === 0;
    const cursorAtEnd = window.getSelection()?.anchorOffset === target.innerText.length;

    // Handle Enter key
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      if (showSlashMenu) {
        // If slash menu is open, close it
        setShowSlashMenu(false);
        return;
      }

      // Create new block after current one
      onCreate(block.id, "paragraph");
    }

    // Handle Backspace at start of block
    if (e.key === "Backspace" && cursorAtStart && !isFirst) {
      e.preventDefault();
      if (content === "") {
        // Delete empty block
        onDelete(block.id);
      } else {
        // Merge with previous block
        onMergeWithPrevious(block.id);
      }
    }

    // Handle Delete key at end of block
    if (e.key === "Delete" && cursorAtEnd && !isLast) {
      e.preventDefault();
      // Merge with next block
      onMergeWithNext(block.id);
    }

    // Handle ArrowUp - move to previous block
    if (e.key === "ArrowUp" && cursorAtStart && previousBlockId) {
      e.preventDefault();
      onFocus?.(previousBlockId);
    }

    // Handle ArrowDown - move to next block
    if (e.key === "ArrowDown" && cursorAtEnd && nextBlockId) {
      e.preventDefault();
      onFocus?.(nextBlockId);
    }

    // Handle slash menu navigation
    if (showSlashMenu) {
      if (e.key === "Escape") {
        e.preventDefault();
        setShowSlashMenu(false);
        setSlashMenuQuery("");
      }
    }

    // Allow global shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+S) to bubble up
    if ((e.metaKey || e.ctrlKey) && (e.key === "z" || e.key === "y" || e.key === "s")) {
      // Don't prevent default - let the global handler in page.tsx handle these
      return;
    }

    // Text formatting shortcuts
    if ((e.metaKey || e.ctrlKey) && e.key === "b") {
      e.preventDefault();
      document.execCommand("bold", false);
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "i") {
      e.preventDefault();
      document.execCommand("italic", false);
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "u") {
      e.preventDefault();
      document.execCommand("underline", false);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };

  const handleSlashCommand = (type: ContentBlockType) => {
    // Clear the slash command text
    if (contentRef.current) {
      contentRef.current.innerText = "";
    }
    onUpdate(block.id, "");
    onTypeChange(block.id, type);
    setShowSlashMenu(false);
    setSlashMenuQuery("");
  };

  // Slash menu items
  const slashMenuItems = [
    { type: "paragraph" as ContentBlockType, label: "Text", description: "Plain text paragraph", icon: "¶" },
    { type: "heading1" as ContentBlockType, label: "Heading 1", description: "Large section heading", icon: "H1" },
    { type: "heading2" as ContentBlockType, label: "Heading 2", description: "Medium section heading", icon: "H2" },
    { type: "heading3" as ContentBlockType, label: "Heading 3", description: "Small section heading", icon: "H3" },
    { type: "bulletList" as ContentBlockType, label: "Bullet List", description: "Bulleted list item", icon: "•" },
    { type: "numberedList" as ContentBlockType, label: "Numbered List", description: "Numbered list item", icon: "1." },
    { type: "todoList" as ContentBlockType, label: "Todo List", description: "Checkbox list item", icon: "☐" },
    { type: "quote" as ContentBlockType, label: "Quote", description: "Blockquote", icon: "\"" },
    { type: "code" as ContentBlockType, label: "Code", description: "Code block", icon: "</>" },
    { type: "divider" as ContentBlockType, label: "Divider", description: "Horizontal line", icon: "―" },
  ];

  const filteredSlashItems = slashMenuQuery
    ? slashMenuItems.filter(
        (item) =>
          item.label.toLowerCase().includes(slashMenuQuery) ||
          item.type.toLowerCase().includes(slashMenuQuery)
      )
    : slashMenuItems;

  // Render block based on type
  const renderBlockContent = () => {
    const baseClasses = "outline-none focus:outline-none w-full";
    const placeholder = getPlaceholder();

    const commonProps = {
      ref: contentRef,
      contentEditable: true,
      suppressContentEditableWarning: true,
      onInput: handleInput,
      onKeyDown: handleKeyDown,
      onPaste: handlePaste,
      onFocus: () => {
        setIsEditing(true);
        onFocus?.(block.id);
      },
      onBlur: () => setIsEditing(false),
      "data-placeholder": placeholder,
      className: `${baseClasses} empty:before:content-[attr(data-placeholder)] empty:before:text-zinc-400 empty:before:cursor-text`,
    };

    switch (block.type) {
      case "heading1":
        return (
          <h1
            {...commonProps}
            className={`${commonProps.className} text-3xl font-bold mb-1 mt-4 first:mt-0`}
          />
        );

      case "heading2":
        return (
          <h2
            {...commonProps}
            className={`${commonProps.className} text-2xl font-bold mb-1 mt-3 first:mt-0`}
          />
        );

      case "heading3":
        return (
          <h3
            {...commonProps}
            className={`${commonProps.className} text-xl font-bold mb-1 mt-2 first:mt-0`}
          />
        );

      case "bulletList":
        return (
          <div className="flex items-start gap-2 mb-1">
            <span className="text-zinc-500 mt-1.5 select-none">•</span>
            <div {...commonProps} className={`${commonProps.className} flex-1`} />
          </div>
        );

      case "numberedList":
        return (
          <div className="flex items-start gap-2 mb-1">
            <span className="text-zinc-500 mt-1.5 select-none min-w-[1.5rem]">1.</span>
            <div {...commonProps} className={`${commonProps.className} flex-1`} />
          </div>
        );

      case "todoList":
        return (
          <div className="flex items-start gap-2 mb-1">
            <button
              onClick={() => setTodoChecked(!todoChecked)}
              className="mt-1.5 w-4 h-4 border-2 border-zinc-400 rounded flex items-center justify-center hover:border-zinc-600 transition-colors"
            >
              {todoChecked && <Check size={12} className="text-zinc-600" />}
            </button>
            <div
              {...commonProps}
              className={`${commonProps.className} flex-1 ${todoChecked ? "line-through text-zinc-400" : ""}`}
            />
          </div>
        );

      case "quote":
        return (
          <blockquote className="border-l-4 border-zinc-300 dark:border-zinc-700 pl-4 py-1 mb-1">
            <div {...commonProps} className={`${commonProps.className} italic text-zinc-600 dark:text-zinc-400`} />
          </blockquote>
        );

      case "code":
        return (
          <pre className="bg-zinc-100 dark:bg-zinc-900 rounded-lg p-4 mb-1 overflow-x-auto">
            <code
              {...commonProps}
              className={`${commonProps.className} text-sm font-mono text-zinc-800 dark:text-zinc-200 block`}
            />
          </pre>
        );

      case "divider":
        return (
          <div className="my-4 relative group">
            <hr className="border-t border-zinc-200 dark:border-zinc-800" />
            {isEditing && (
              <div className="absolute -top-3 left-0 right-0 flex justify-center">
                <button
                  onClick={() => onDelete(block.id)}
                  className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div {...commonProps} className={`${commonProps.className} mb-1`} />
        );
    }
  };

  const getPlaceholder = (): string => {
    switch (block.type) {
      case "heading1":
        return "Heading 1";
      case "heading2":
        return "Heading 2";
      case "heading3":
        return "Heading 3";
      case "bulletList":
        return "List item";
      case "numberedList":
        return "List item";
      case "todoList":
        return "Todo item";
      case "quote":
        return "Quote";
      case "code":
        return "Code";
      default:
        return "Type '/' for commands";
    }
  };

  return (
    <div className="relative group">
      {/* Drag handle - shown on hover */}
      <div className="absolute -left-6 top-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
        <GripVertical size={16} className="text-zinc-400" />
      </div>

      {/* Block content */}
      {renderBlockContent()}

      {/* Slash command menu */}
      {showSlashMenu && filteredSlashItems.length > 0 && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl min-w-[280px] max-h-[300px] overflow-y-auto">
          {filteredSlashItems.map((item) => (
            <button
              key={item.type}
              onClick={() => handleSlashCommand(item.type)}
              className="w-full flex items-start gap-3 px-3 py-2 text-left hover:bg-zinc-700 transition-colors"
            >
              <span className="text-lg leading-none mt-0.5">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {item.label}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {item.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
