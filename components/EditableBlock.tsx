"use client";

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from "react";
import { ContentBlock, ContentBlockType } from "@/lib/types";
import { Check, GripVertical } from "lucide-react";
import SlashCommandMenu from "./SlashCommandMenu";

interface EditableBlockProps {
  block: ContentBlock;
  blockIndex: number;
  allBlocks: ContentBlock[];
  onUpdate: (blockId: string, content: string) => void;
  onMetadataUpdate?: (blockId: string, metadata: Record<string, unknown>) => void;
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

/**
 * Detect if the device is mobile (phone or tablet)
 * Returns true for mobile devices, false for desktop
 */
function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;

  // Check user agent for mobile indicators
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;

  // Also check for touch-only devices (no mouse)
  const isTouchOnly =
    'ontouchstart' in window &&
    !window.matchMedia('(pointer: fine)').matches;

  return mobileRegex.test(userAgent) || isTouchOnly;
}

export default function EditableBlock({
  block,
  blockIndex,
  allBlocks,
  onUpdate,
  onMetadataUpdate,
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
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const toggleContentRef = useRef<HTMLDivElement>(null);
  const content = typeof block.content === "string" ? block.content : "";

  // Get todo checked state from metadata
  const todoChecked = block.metadata?.checked === true;

  // Get toggle collapsed state from metadata
  const toggleCollapsed = block.metadata?.collapsed === true;

  // Get indent level from metadata (0-4)
  const indentLevel = Math.min(4, Math.max(0, (block.metadata?.indentLevel as number) || 0));

  // Calculate numbered list position (count consecutive numbered lists before this block)
  const getListNumber = (): number => {
    if (block.type !== "numberedList") return 1;

    let count = 1;
    for (let i = blockIndex - 1; i >= 0; i--) {
      if (allBlocks[i].type === "numberedList") {
        count++;
      } else {
        break; // Stop when we hit a non-numbered-list block
      }
    }
    return count;
  };

  const listNumber = getListNumber();

  // Detect mobile device on mount
  useEffect(() => {
    const mobile = isMobileDevice();
    console.log('[EditableBlock] Mobile detection:', {
      isMobile: mobile,
      userAgent: navigator.userAgent,
      hasPointerFine: window.matchMedia('(pointer: fine)').matches
    });
    setIsMobile(mobile);
  }, []);

  // Focus on the block when editing starts
  useEffect(() => {
    if (isEditing && contentRef.current) {
      contentRef.current.focus();
      // Move cursor to end
      try {
        const range = document.createRange();
        const sel = window.getSelection();
        if (contentRef.current.childNodes.length > 0) {
          const lastNode = contentRef.current.childNodes[contentRef.current.childNodes.length - 1];
          // Check if lastNode is a text node
          if (lastNode.nodeType === Node.TEXT_NODE) {
            const offset = Math.min(lastNode.textContent?.length || 0, lastNode.textContent?.length || 0);
            range.setStart(lastNode, offset);
          } else {
            // If not a text node, set range at the end of the element
            range.selectNodeContents(contentRef.current);
            range.collapse(false);
          }
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      } catch (e) {
        // Silently catch any range errors
        console.warn('Error setting cursor position:', e);
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
      try {
        const range = document.createRange();
        const sel = window.getSelection();
        if (contentRef.current.childNodes.length > 0) {
          const lastNode = contentRef.current.childNodes[contentRef.current.childNodes.length - 1];
          // Check if lastNode is a text node
          if (lastNode.nodeType === Node.TEXT_NODE) {
            const offset = Math.min(lastNode.textContent?.length || 0, lastNode.textContent?.length || 0);
            range.setStart(lastNode, offset);
          } else {
            // If not a text node, set range at the end of the element
            range.selectNodeContents(contentRef.current);
            range.collapse(false);
          }
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      } catch (e) {
        // Silently catch any range errors
        console.warn('Error setting cursor position:', e);
      }
    }
  }, [shouldFocus]);

  const handleInput = () => {
    if (contentRef.current) {
      const newContent = contentRef.current.innerText;

      // Debug logging
      console.log('[EditableBlock] Input:', { newContent, isMobile, startsWithSlash: newContent.startsWith("/"), length: newContent.length });

      // Only enable slash commands on desktop (not on mobile devices)
      if (!isMobile && newContent.startsWith("/")) {
        setShowSlashMenu(true);
        setSlashMenuQuery(newContent.slice(1).toLowerCase());
        console.log('[EditableBlock] Showing slash menu with query:', newContent.slice(1).toLowerCase());
      } else {
        if (showSlashMenu) {
          console.log('[EditableBlock] Hiding slash menu');
        }
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
      // If slash menu is open, don't handle Enter here - let the menu handle it
      if (showSlashMenu) {
        // The slash menu will handle the selection and call handleSlashCommand
        // We just need to prevent the default behavior and return
        e.preventDefault();
        return;
      }

      e.preventDefault();

      // Notion-style list behavior
      const isListType = ["bulletList", "numberedList", "todoList", "toggleList"].includes(block.type);
      const isEmpty = content.trim() === "";

      if (isListType && isEmpty) {
        // Exit list mode: convert empty list item to paragraph
        onTypeChange(block.id, "paragraph");
      } else if (isListType) {
        // Continue the list: create same type
        onCreate(block.id, block.type);
      } else {
        // Default: create new paragraph
        onCreate(block.id, "paragraph");
      }
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

    // Handle Tab for list indentation
    if (e.key === "Tab") {
      const isListType = ["bulletList", "numberedList", "todoList", "toggleList"].includes(block.type);

      if (isListType && onMetadataUpdate) {
        e.preventDefault();

        if (e.shiftKey) {
          // Shift+Tab: Decrease indent
          if (indentLevel > 0) {
            onMetadataUpdate(block.id, {
              ...block.metadata,
              indentLevel: indentLevel - 1
            });
          }
        } else {
          // Tab: Increase indent (max 4 levels)
          if (indentLevel < 4) {
            onMetadataUpdate(block.id, {
              ...block.metadata,
              indentLevel: indentLevel + 1
            });
          }
        }
        return;
      }
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

    // Focus back on the content after a brief delay to allow the type change to complete
    setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.focus();
      }
    }, 0);
  };

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
          <div className="flex items-baseline gap-1.5 mb-1" style={{ marginLeft: `${indentLevel * 1.5}rem` }}>
            <span className="text-zinc-500 select-none">•</span>
            <div {...commonProps} className={`${commonProps.className} flex-1`} />
          </div>
        );

      case "numberedList":
        return (
          <div className="flex items-baseline gap-1.5 mb-1" style={{ marginLeft: `${indentLevel * 1.5}rem` }}>
            <span className="text-zinc-500 select-none min-w-[1.5rem] text-right">{listNumber}.</span>
            <div {...commonProps} className={`${commonProps.className} flex-1`} />
          </div>
        );

      case "todoList":
        return (
          <div className="flex items-baseline gap-1.5 mb-1" style={{ marginLeft: `${indentLevel * 1.5}rem` }}>
            <button
              onClick={() => {
                if (onMetadataUpdate) {
                  onMetadataUpdate(block.id, {
                    ...block.metadata,
                    checked: !todoChecked
                  });
                }
              }}
              className="mt-0.5 w-4 h-4 border-2 border-zinc-400 rounded flex items-center justify-center hover:border-zinc-600 transition-colors flex-shrink-0"
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
            <div {...commonProps} className={`${commonProps.className} italic text-zinc-400`} />
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

      case "toggleList":
        // Get toggle content from metadata
        const toggleContent = (block.metadata?.toggleContent as string) || "";

        return (
          <div className="mb-1" style={{ marginLeft: `${indentLevel * 1.5}rem` }}>
            <div className="flex items-start gap-1.5 group/toggle">
              <button
                onClick={() => {
                  if (onMetadataUpdate) {
                    onMetadataUpdate(block.id, {
                      ...block.metadata,
                      collapsed: !toggleCollapsed
                    });
                  }
                }}
                className={`text-zinc-500 hover:text-zinc-300 transition-all duration-200 flex-shrink-0 mt-1 ${
                  toggleCollapsed ? "" : "rotate-90"
                }`}
                style={{ transformOrigin: "center" }}
              >
                ▶
              </button>
              <div className="flex-1">
                {/* Toggle header */}
                <div {...commonProps} className={`${commonProps.className} font-medium`} />

                {/* Toggle content area */}
                {!toggleCollapsed && (
                  <div className="ml-0 mt-2 pl-4 border-l-2 border-zinc-800">
                    <div
                      ref={toggleContentRef}
                      contentEditable
                      suppressContentEditableWarning
                      onInput={(e) => {
                        if (onMetadataUpdate) {
                          onMetadataUpdate(block.id, {
                            ...block.metadata,
                            toggleContent: e.currentTarget.innerText
                          });
                        }
                      }}
                      onFocus={() => {
                        // Move cursor to end when focusing
                        setTimeout(() => {
                          if (toggleContentRef.current) {
                            const range = document.createRange();
                            const sel = window.getSelection();
                            range.selectNodeContents(toggleContentRef.current);
                            range.collapse(false);
                            sel?.removeAllRanges();
                            sel?.addRange(range);
                          }
                        }, 0);
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const text = e.clipboardData.getData("text/plain");
                        document.execCommand("insertText", false, text);
                      }}
                      className="outline-none text-sm text-zinc-300 p-2 rounded hover:bg-zinc-900/30 focus:bg-zinc-900/50 transition-colors empty:before:content-[attr(data-placeholder)] empty:before:text-zinc-600"
                      data-placeholder="Add content inside toggle..."
                      dangerouslySetInnerHTML={{ __html: toggleContent }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "callout":
        const calloutTheme = (block.metadata?.theme as string) || "info";
        const calloutEmoji = (block.metadata?.emoji as string) || "💡";

        const calloutThemes = {
          info: { bg: "bg-blue-500/10", border: "border-blue-500", text: "text-blue-100", icon: "text-blue-500" },
          warning: { bg: "bg-yellow-500/10", border: "border-yellow-500", text: "text-yellow-100", icon: "text-yellow-500" },
          error: { bg: "bg-red-500/10", border: "border-red-500", text: "text-red-100", icon: "text-red-500" },
          success: { bg: "bg-green-500/10", border: "border-green-500", text: "text-green-100", icon: "text-green-500" },
          purple: { bg: "bg-purple-500/10", border: "border-purple-500", text: "text-purple-100", icon: "text-purple-500" },
        };

        const theme = calloutThemes[calloutTheme as keyof typeof calloutThemes] || calloutThemes.info;

        return (
          <div className={`my-2 ${theme.bg} border-l-4 ${theme.border} rounded-r-lg p-4 group`}>
            <div className="flex items-start gap-3">
              <button
                onClick={() => {
                  if (onMetadataUpdate) {
                    const emojis = ["💡", "⚠️", "❌", "✅", "📝", "🔔", "⭐", "🎯"];
                    const currentIndex = emojis.indexOf(calloutEmoji);
                    const nextEmoji = emojis[(currentIndex + 1) % emojis.length];
                    onMetadataUpdate(block.id, {
                      ...block.metadata,
                      emoji: nextEmoji
                    });
                  }
                }}
                className={`${theme.icon} text-xl mt-0.5 hover:scale-110 transition-transform cursor-pointer`}
                title="Click to change emoji"
              >
                {calloutEmoji}
              </button>
              <div
                {...commonProps}
                className={`${commonProps.className} flex-1 ${theme.text}`}
              />
              <select
                value={calloutTheme}
                onChange={(e) => {
                  if (onMetadataUpdate) {
                    onMetadataUpdate(block.id, {
                      ...block.metadata,
                      theme: e.target.value
                    });
                  }
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 text-zinc-200 text-xs px-2 py-1 rounded border border-zinc-700"
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
                <option value="success">Success</option>
                <option value="purple">Purple</option>
              </select>
            </div>
          </div>
        );

      case "table":
        // Get table data from metadata or create default
        const tableData = (block.metadata?.tableData as string[][]) || [
          ["", ""],
          ["", ""]
        ];
        const hasHeaders = (block.metadata?.hasHeaders as boolean) ?? true;

        const updateTableCell = (rowIndex: number, colIndex: number, value: string) => {
          if (onMetadataUpdate) {
            const newTableData = tableData.map((row, ri) =>
              ri === rowIndex
                ? row.map((cell, ci) => (ci === colIndex ? value : cell))
                : row
            );
            onMetadataUpdate(block.id, {
              ...block.metadata,
              tableData: newTableData
            });
          }
        };

        const addRow = () => {
          if (onMetadataUpdate) {
            const newRow = Array(tableData[0]?.length || 2).fill("");
            onMetadataUpdate(block.id, {
              ...block.metadata,
              tableData: [...tableData, newRow]
            });
          }
        };

        const addColumn = () => {
          if (onMetadataUpdate) {
            const newTableData = tableData.map(row => [...row, ""]);
            onMetadataUpdate(block.id, {
              ...block.metadata,
              tableData: newTableData
            });
          }
        };

        const deleteRow = (rowIndex: number) => {
          if (onMetadataUpdate && tableData.length > 1) {
            onMetadataUpdate(block.id, {
              ...block.metadata,
              tableData: tableData.filter((_, i) => i !== rowIndex)
            });
          }
        };

        const deleteColumn = (colIndex: number) => {
          if (onMetadataUpdate && tableData[0].length > 1) {
            onMetadataUpdate(block.id, {
              ...block.metadata,
              tableData: tableData.map(row => row.filter((_, i) => i !== colIndex))
            });
          }
        };

        return (
          <div className="my-2 relative group/table">
            <div className="overflow-x-auto overflow-y-visible border border-zinc-700 rounded-lg scrollbar-hide">
              <table className="w-full border-collapse">
                <tbody>
                  {tableData.map((row, rowIndex) => (
                    <tr key={rowIndex} className="group/row relative">
                      {row.map((cell, colIndex) => {
                        const isHeaderRow = hasHeaders && rowIndex === 0;
                        const CellTag = isHeaderRow ? "th" : "td";
                        const isLastRow = rowIndex === tableData.length - 1;
                        const isLastCol = colIndex === row.length - 1;

                        return (
                          <CellTag
                            key={colIndex}
                            className={`border border-zinc-700 p-2 min-w-[100px] relative group/cell ${
                              isHeaderRow ? "bg-zinc-800 font-semibold" : "bg-zinc-900/50"
                            }`}
                          >
                            <input
                              type="text"
                              value={cell}
                              onChange={(e) => updateTableCell(rowIndex, colIndex, e.target.value)}
                              className="w-full bg-transparent text-sm text-zinc-200 outline-none focus:ring-1 focus:ring-blue-500 px-1 py-0.5 rounded"
                              placeholder={isHeaderRow ? "Header" : "Cell"}
                            />
                          </CellTag>
                        );
                      })}
                    </tr>
                  ))}
                  {/* Add/Remove row buttons - center of bottom border */}
                  <tr>
                    <td colSpan={tableData[0]?.length || 2} className="border-none p-0 relative h-0">
                      <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 opacity-0 group-hover/table:opacity-100 flex gap-1">
                        <button
                          onClick={addRow}
                          className="bg-zinc-700 text-zinc-300 text-xs w-4 h-4 flex items-center justify-center rounded hover:bg-zinc-600 transition-all"
                          title="Add row"
                        >
                          +
                        </button>
                        {tableData.length > 1 && (
                          <button
                            onClick={() => deleteRow(tableData.length - 1)}
                            className="bg-zinc-700 text-zinc-300 text-xs w-4 h-4 flex items-center justify-center rounded hover:bg-zinc-600 transition-all"
                            title="Remove row"
                          >
                            -
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
              {/* Add/Remove column buttons - center of right border */}
              <div className="absolute top-1/2 -translate-y-1/2 -right-2 opacity-0 group-hover/table:opacity-100 flex flex-col gap-1">
                <button
                  onClick={addColumn}
                  className="bg-zinc-700 text-zinc-300 text-xs w-4 h-4 flex items-center justify-center rounded hover:bg-zinc-600 transition-all"
                  title="Add column"
                >
                  +
                </button>
                {tableData[0]?.length > 1 && (
                  <button
                    onClick={() => deleteColumn(tableData[0].length - 1)}
                    className="bg-zinc-700 text-zinc-300 text-xs w-4 h-4 flex items-center justify-center rounded hover:bg-zinc-600 transition-all"
                    title="Remove column"
                  >
                    -
                  </button>
                )}
              </div>
            </div>
          </div>
        );

      case "database":
        return (
          <div className="my-2 border border-zinc-700 rounded-lg overflow-hidden bg-zinc-900/50">
            <div className="p-4 text-center text-zinc-500">
              <div className="text-sm mb-2">🗄️ Database Block</div>
              <div
                {...commonProps}
                className={`${commonProps.className} text-xs`}
              />
            </div>
          </div>
        );

      case "kanban":
        return (
          <div className="my-2 border border-zinc-700 rounded-lg overflow-hidden bg-zinc-900/50">
            <div className="p-4 text-center text-zinc-500">
              <div className="text-sm mb-2">📋 Kanban Board</div>
              <div
                {...commonProps}
                className={`${commonProps.className} text-xs`}
              />
            </div>
          </div>
        );

      case "image":
        const imageUrl = (block.metadata?.url as string) || "";

        return (
          <div className="my-2 border border-zinc-700 rounded-lg overflow-hidden bg-zinc-900/50">
            {imageUrl ? (
              <div>
                <img
                  src={imageUrl}
                  alt="Block image"
                  className="w-full object-cover"
                  style={{ maxHeight: '500px' }}
                />
                <div className="p-2 border-t border-zinc-700">
                  <div
                    {...commonProps}
                    className={`${commonProps.className} text-xs text-zinc-400`}
                    data-placeholder="Add caption..."
                  />
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-zinc-500">
                <div className="text-sm mb-2">🖼️ Image</div>
                <input
                  type="text"
                  placeholder="Paste image URL..."
                  value={imageUrl}
                  onChange={(e) => {
                    if (onMetadataUpdate) {
                      onMetadataUpdate(block.id, {
                        ...block.metadata,
                        url: e.target.value
                      });
                    }
                  }}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-200 outline-none focus:border-blue-500 mb-2"
                />
                <div className="text-xs text-zinc-600 mt-2">Or upload from Supabase storage (coming soon)</div>
              </div>
            )}
          </div>
        );

      case "file":
        const fileUrl = (block.metadata?.url as string) || "";
        const fileName = (block.metadata?.name as string) || fileUrl.split('/').pop() || "File";

        return (
          <div className="my-2 border border-zinc-700 rounded-lg overflow-hidden bg-zinc-900/50 p-4">
            {fileUrl ? (
              <div>
                <a
                  href={fileUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2 hover:bg-zinc-800 rounded transition-colors"
                >
                  <div className="text-2xl">📎</div>
                  <div className="flex-1">
                    <div className="text-sm text-zinc-200">{fileName}</div>
                    <div className="text-xs text-zinc-500">Click to download</div>
                  </div>
                </a>
              </div>
            ) : (
              <div className="text-center text-zinc-500">
                <div className="text-sm mb-2">📎 File Attachment</div>
                <input
                  type="text"
                  placeholder="Paste file URL..."
                  value={fileUrl}
                  onChange={(e) => {
                    if (onMetadataUpdate) {
                      onMetadataUpdate(block.id, {
                        ...block.metadata,
                        url: e.target.value
                      });
                    }
                  }}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-200 outline-none focus:border-blue-500 mb-2"
                />
                <div className="text-xs text-zinc-600 mt-2">Or upload to Supabase storage (coming soon)</div>
              </div>
            )}
          </div>
        );

      case "video":
        const videoUrl = (block.metadata?.url as string) || "";

        // Extract YouTube ID from various URL formats
        const getYouTubeId = (url: string) => {
          const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
          return match ? match[1] : null;
        };

        const youtubeId = getYouTubeId(videoUrl);

        return (
          <div className="my-2 border border-zinc-700 rounded-lg overflow-hidden bg-zinc-900/50">
            {youtubeId ? (
              <div className="aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            ) : (
              <div className="p-4 text-center text-zinc-500">
                <div className="text-sm mb-2">🎥 Video</div>
                <input
                  type="text"
                  placeholder="Paste YouTube URL..."
                  value={videoUrl}
                  onChange={(e) => {
                    if (onMetadataUpdate) {
                      onMetadataUpdate(block.id, {
                        ...block.metadata,
                        url: e.target.value
                      });
                    }
                  }}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-200 outline-none focus:border-blue-500"
                />
              </div>
            )}
            <div className="p-2 border-t border-zinc-700">
              <div
                {...commonProps}
                className={`${commonProps.className} text-xs text-zinc-400`}
                data-placeholder="Add caption..."
              />
            </div>
          </div>
        );

      case "audio":
        const audioUrl = (block.metadata?.url as string) || "";

        return (
          <div className="my-2 border border-zinc-700 rounded-lg overflow-hidden bg-zinc-900/50 p-4">
            <div className="text-zinc-500">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🎵</span>
                <span className="text-sm font-medium">Audio</span>
              </div>
              {audioUrl ? (
                <audio controls className="w-full mb-2">
                  <source src={audioUrl} />
                  Your browser does not support the audio element.
                </audio>
              ) : (
                <input
                  type="text"
                  placeholder="Paste audio URL (mp3, wav, ogg)..."
                  value={audioUrl}
                  onChange={(e) => {
                    if (onMetadataUpdate) {
                      onMetadataUpdate(block.id, {
                        ...block.metadata,
                        url: e.target.value
                      });
                    }
                  }}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-200 outline-none focus:border-blue-500 mb-2"
                />
              )}
              <div
                {...commonProps}
                className={`${commonProps.className} text-xs`}
                data-placeholder="Add caption..."
              />
            </div>
          </div>
        );

      case "bookmark":
        const bookmarkUrl = (block.metadata?.url as string) || "";

        // Extract domain from URL
        const getDomain = (url: string) => {
          try {
            const urlObj = new URL(url);
            return urlObj.hostname.replace('www.', '');
          } catch {
            return "";
          }
        };

        const domain = getDomain(bookmarkUrl);

        return (
          <div className="my-2 border border-zinc-700 rounded-lg overflow-hidden bg-zinc-900/50 hover:border-zinc-600 transition-colors">
            {bookmarkUrl ? (
              <a
                href={bookmarkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="font-medium text-zinc-200 mb-1">{domain || "Link"}</div>
                    <div className="text-xs text-zinc-500 truncate">{bookmarkUrl}</div>
                  </div>
                  <div className="text-2xl">🔖</div>
                </div>
              </a>
            ) : (
              <div className="p-4">
                <div className="text-zinc-500">
                  <div className="text-sm mb-2">🔖 Bookmark</div>
                  <input
                    type="text"
                    placeholder="Paste URL..."
                    value={bookmarkUrl}
                    onChange={(e) => {
                      if (onMetadataUpdate) {
                        onMetadataUpdate(block.id, {
                          ...block.metadata,
                          url: e.target.value
                        });
                      }
                    }}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-200 outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        );

      case "embed":
        const embedCode = (block.metadata?.embedCode as string) || "";

        return (
          <div className="my-2 border border-zinc-700 rounded-lg overflow-hidden bg-zinc-900/50 p-4">
            <div className="text-zinc-500">
              <div className="text-sm mb-2">🌐 Embed</div>
              <textarea
                placeholder="Paste iframe embed code..."
                value={embedCode}
                onChange={(e) => {
                  if (onMetadataUpdate) {
                    onMetadataUpdate(block.id, {
                      ...block.metadata,
                      embedCode: e.target.value
                    });
                  }
                }}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-200 outline-none focus:border-blue-500 font-mono mb-2"
                rows={3}
              />
              {embedCode && (
                <div
                  className="mt-2"
                  dangerouslySetInnerHTML={{ __html: embedCode }}
                />
              )}
            </div>
          </div>
        );

      case "date":
        const dateValue = (block.metadata?.date as string) || "";
        const formattedDate = dateValue ? new Date(dateValue).toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }) : "";

        return (
          <div className="mb-1 inline-block">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg hover:border-zinc-600 transition-colors group">
              <span className="text-zinc-400">📅</span>
              <input
                type="date"
                value={dateValue}
                onChange={(e) => {
                  if (onMetadataUpdate) {
                    onMetadataUpdate(block.id, {
                      ...block.metadata,
                      date: e.target.value
                    });
                  }
                }}
                className="text-sm bg-transparent border-none outline-none text-zinc-200 cursor-pointer"
                style={{ colorScheme: 'dark' }}
              />
              {formattedDate && (
                <span className="text-xs text-zinc-500 ml-1">({formattedDate})</span>
              )}
              <div
                {...commonProps}
                className={`${commonProps.className} text-sm ml-2`}
                data-placeholder="Add note..."
              />
            </div>
          </div>
        );

      case "tag":
        const tagColor = (block.metadata?.color as string) || "purple";

        const tagColors = {
          purple: { bg: "bg-purple-500/20", border: "border-purple-500/30", text: "text-purple-300" },
          blue: { bg: "bg-blue-500/20", border: "border-blue-500/30", text: "text-blue-300" },
          green: { bg: "bg-green-500/20", border: "border-green-500/30", text: "text-green-300" },
          yellow: { bg: "bg-yellow-500/20", border: "border-yellow-500/30", text: "text-yellow-300" },
          red: { bg: "bg-red-500/20", border: "border-red-500/30", text: "text-red-300" },
          pink: { bg: "bg-pink-500/20", border: "border-pink-500/30", text: "text-pink-300" },
          gray: { bg: "bg-zinc-500/20", border: "border-zinc-500/30", text: "text-zinc-300" },
        };

        const tagTheme = tagColors[tagColor as keyof typeof tagColors] || tagColors.purple;

        return (
          <div className="mb-1 inline-block group/tag">
            <div className={`flex items-center gap-2 px-3 py-1 ${tagTheme.bg} border ${tagTheme.border} rounded-full`}>
              <button
                onClick={() => {
                  if (onMetadataUpdate) {
                    const colors = ["purple", "blue", "green", "yellow", "red", "pink", "gray"];
                    const currentIndex = colors.indexOf(tagColor);
                    const nextColor = colors[(currentIndex + 1) % colors.length];
                    onMetadataUpdate(block.id, {
                      ...block.metadata,
                      color: nextColor
                    });
                  }
                }}
                className="text-xs opacity-50 group-hover/tag:opacity-100 transition-opacity"
                title="Click to change color"
              >
                🏷️
              </button>
              <div
                {...commonProps}
                className={`${commonProps.className} text-sm ${tagTheme.text}`}
                data-placeholder="Tag name..."
              />
            </div>
          </div>
        );

      case "progressBar":
        const progress = Math.min(100, Math.max(0, (block.metadata?.progress as number) || 0));

        return (
          <div className="my-2">
            <div className="mb-2">
              <div
                {...commonProps}
                className={`${commonProps.className} text-sm mb-1`}
                data-placeholder="Progress label..."
              />
            </div>
            <div
              className="h-2 bg-zinc-800 rounded-full overflow-hidden cursor-pointer"
              onClick={(e) => {
                if (onMetadataUpdate) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const newProgress = Math.round((x / rect.width) * 100);
                  onMetadataUpdate(block.id, {
                    ...block.metadata,
                    progress: newProgress
                  });
                }
              }}
              title="Click to adjust progress"
            >
              <div
                className={`h-full transition-all ${
                  progress >= 100 ? "bg-green-500" : progress >= 75 ? "bg-blue-500" : progress >= 50 ? "bg-yellow-500" : "bg-orange-500"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1">
              <input
                type="number"
                value={progress}
                onChange={(e) => {
                  if (onMetadataUpdate) {
                    const val = parseInt(e.target.value) || 0;
                    onMetadataUpdate(block.id, {
                      ...block.metadata,
                      progress: Math.min(100, Math.max(0, val))
                    });
                  }
                }}
                min="0"
                max="100"
                className="text-xs text-zinc-400 bg-transparent border-none outline-none w-12"
              />
              <span className="text-xs text-zinc-500">%</span>
            </div>
          </div>
        );

      case "calendar":
        return (
          <div className="my-2 border border-zinc-700 rounded-lg overflow-hidden bg-zinc-900/50 p-4">
            <div className="text-center text-zinc-500">
              <div className="text-sm mb-2">📆 Calendar View</div>
              <div
                {...commonProps}
                className={`${commonProps.className} text-xs`}
              />
            </div>
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
        // Only show slash command hint on desktop devices
        return isHovered && !isMobile ? "Type '/' for commands" : "";
    }
  };

  return (
    <div
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Drag handle - shown on hover */}
      <div className="absolute -left-6 top-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
        <GripVertical size={16} className="text-zinc-400" />
      </div>

      {/* Block content */}
      {renderBlockContent()}

      {/* Slash command menu */}
      {showSlashMenu && (
        <SlashCommandMenu
          query={slashMenuQuery}
          onSelect={handleSlashCommand}
          onClose={() => {
            setShowSlashMenu(false);
            setSlashMenuQuery("");
          }}
        />
      )}
    </div>
  );
}
