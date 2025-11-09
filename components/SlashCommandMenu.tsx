"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { ContentBlockType } from "@/lib/types";
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  ChevronRight,
  Quote,
  Minus,
  Code,
  Table,
  Database,
  Image,
  FileText,
  Video,
  Music,
  Link,
  Globe,
  Calendar,
  Tag,
  BarChart3,
  Columns,
  Info,
  LucideIcon,
} from "lucide-react";

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface SlashMenuItem {
  type: ContentBlockType;
  label: string;
  description: string;
  category: string;
  icon: LucideIcon;
  keywords?: string[]; // Additional search keywords
}

interface SlashCommandMenuProps {
  query: string;
  onSelect: (type: ContentBlockType) => void;
  onClose: () => void;
  position?: { top: number; left: number };
}

// ============================================================================
// Menu Items Configuration
// ============================================================================

const SLASH_MENU_ITEMS: SlashMenuItem[] = [
  {
    type: "heading1",
    label: "Heading 1",
    description: "Large section heading",
    category: "Basic",
    icon: Heading1,
    keywords: ["h1", "title", "large"],
  },
  {
    type: "heading2",
    label: "Heading 2",
    description: "Medium section heading",
    category: "Basic",
    icon: Heading2,
    keywords: ["h2", "subtitle"],
  },
  {
    type: "heading3",
    label: "Heading 3",
    description: "Small section heading",
    category: "Basic",
    icon: Heading3,
    keywords: ["h3", "subheading"],
  },
  {
    type: "table",
    label: "Table",
    description: "Tabular data grid",
    category: "Basic",
    icon: Table,
    keywords: ["table", "grid", "spreadsheet"],
  },

  // Lists
  {
    type: "bulletList",
    label: "Bullet List",
    description: "Simple bulleted list",
    category: "Lists",
    icon: List,
    keywords: ["bullet", "unordered", "ul"],
  },
  {
    type: "numberedList",
    label: "Numbered List",
    description: "Numbered list",
    category: "Lists",
    icon: ListOrdered,
    keywords: ["numbered", "ordered", "ol", "1"],
  },
  {
    type: "todoList",
    label: "Todo List",
    description: "Checkbox list",
    category: "Lists",
    icon: CheckSquare,
    keywords: ["todo", "checkbox", "task", "check"],
  },
  {
    type: "toggleList",
    label: "Toggle List",
    description: "Collapsible toggle section",
    category: "Lists",
    icon: ChevronRight,
    keywords: ["toggle", "collapse", "accordion", "dropdown"],
  },

  // Text Formatting
  {
    type: "quote",
    label: "Quote",
    description: "Blockquote for citations",
    category: "Text",
    icon: Quote,
    keywords: ["quote", "citation", "blockquote"],
  },
  {
    type: "callout",
    label: "Callout",
    description: "Highlighted info box",
    category: "Text",
    icon: Info,
    keywords: ["callout", "info", "notice", "alert", "box"],
  },
  {
    type: "divider",
    label: "Divider",
    description: "Horizontal divider line",
    category: "Text",
    icon: Minus,
    keywords: ["divider", "separator", "line", "hr"],
  },
  {
    type: "code",
    label: "Code Block",
    description: "Code with syntax highlighting",
    category: "Text",
    icon: Code,
    keywords: ["code", "snippet", "pre", "programming"],
  },

  // Media & Embeds
  {
    type: "image",
    label: "Image",
    description: "Upload or embed an image",
    category: "Media",
    icon: Image,
    keywords: ["image", "picture", "photo", "img"],
  },
  {
    type: "file",
    label: "File",
    description: "Upload a file attachment",
    category: "Media",
    icon: FileText,
    keywords: ["file", "upload", "attachment", "document"],
  },
  {
    type: "video",
    label: "Video",
    description: "Embed YouTube or video file",
    category: "Media",
    icon: Video,
    keywords: ["video", "youtube", "vimeo", "mp4"],
  },
  {
    type: "audio",
    label: "Audio",
    description: "Embed audio file",
    category: "Media",
    icon: Music,
    keywords: ["audio", "music", "sound", "mp3"],
  },
  {
    type: "bookmark",
    label: "Bookmark",
    description: "Link preview card",
    category: "Media",
    icon: Link,
    keywords: ["bookmark", "link", "url", "preview"],
  },
  {
    type: "embed",
    label: "Embed",
    description: "Embed external content",
    category: "Media",
    icon: Globe,
    keywords: ["embed", "iframe", "external"],
  },

  // Productivity
  {
    type: "date",
    label: "Date",
    description: "Date or reminder",
    category: "Productivity",
    icon: Calendar,
    keywords: ["date", "time", "reminder", "calendar", "schedule"],
  },
  {
    type: "tag",
    label: "Tag",
    description: "Colored label tag",
    category: "Productivity",
    icon: Tag,
    keywords: ["tag", "label", "category"],
  },
  {
    type: "progressBar",
    label: "Progress Bar",
    description: "Visual progress indicator",
    category: "Productivity",
    icon: BarChart3,
    keywords: ["progress", "bar", "percent", "status"],
  },
  {
    type: "calendar",
    label: "Calendar View",
    description: "Calendar timeline view",
    category: "Productivity",
    icon: Calendar,
    keywords: ["calendar", "timeline", "schedule"],
  },
];

// ============================================================================
// Recently Used Commands Manager
// ============================================================================

const RECENT_COMMANDS_KEY = "slash-commands-recent";
const MAX_RECENT_COMMANDS = 5;

function getRecentCommands(): ContentBlockType[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(RECENT_COMMANDS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addRecentCommand(type: ContentBlockType): void {
  if (typeof window === "undefined") return;
  try {
    const recent = getRecentCommands();
    const filtered = recent.filter((t) => t !== type);
    const updated = [type, ...filtered].slice(0, MAX_RECENT_COMMANDS);
    localStorage.setItem(RECENT_COMMANDS_KEY, JSON.stringify(updated));
  } catch {
    // Ignore localStorage errors
  }
}

// ============================================================================
// Fuzzy Search Filter
// ============================================================================

/**
 * Smart fuzzy filter that matches:
 * - Label starts with query
 * - Label contains query
 * - Description contains query
 * - Keywords contain query
 * - Fuzzy character sequence (e.g., "ima" matches "image")
 */
function fuzzyScore(item: SlashMenuItem, query: string): number {
  const q = query.toLowerCase();
  const label = item.label.toLowerCase();
  const desc = item.description.toLowerCase();
  const keywords = item.keywords?.join(" ").toLowerCase() || "";

  // Exact label match (highest score)
  if (label === q) return 1000;

  // Label starts with query
  if (label.startsWith(q)) return 900;

  // Label contains query
  if (label.includes(q)) return 800;

  // Description starts with query
  if (desc.startsWith(q)) return 700;

  // Keywords start with query
  if (keywords.startsWith(q)) return 650;

  // Description contains query
  if (desc.includes(q)) return 600;

  // Keywords contain query
  if (keywords.includes(q)) return 550;

  // Fuzzy character sequence matching
  let labelIndex = 0;
  let queryIndex = 0;
  while (labelIndex < label.length && queryIndex < q.length) {
    if (label[labelIndex] === q[queryIndex]) {
      queryIndex++;
    }
    labelIndex++;
  }
  if (queryIndex === q.length) return 500 - labelIndex; // Fuzzy match, prefer shorter labels

  return 0; // No match
}

function filterAndSortItems(items: SlashMenuItem[], query: string): SlashMenuItem[] {
  if (!query) return items;

  const scored = items
    .map((item) => ({ item, score: fuzzyScore(item, query) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.map(({ item }) => item);
}

// ============================================================================
// Component
// ============================================================================

export default function SlashCommandMenu({
  query,
  onSelect,
  onClose,
  position,
}: SlashCommandMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const recentCommands = useMemo(() => getRecentCommands(), []);

  // Filter and organize items
  const { filteredItems, recentItems, categorizedItems } = useMemo(() => {
    const filtered = filterAndSortItems(SLASH_MENU_ITEMS, query);

    // Recent commands (only show when no query)
    const recent = !query
      ? recentCommands
          .map((type) => SLASH_MENU_ITEMS.find((item) => item.type === type))
          .filter((item): item is SlashMenuItem => item !== undefined)
      : [];

    // Group by category
    const categories: Record<string, SlashMenuItem[]> = {};
    filtered.forEach((item) => {
      if (!categories[item.category]) {
        categories[item.category] = [];
      }
      categories[item.category].push(item);
    });

    return {
      filteredItems: filtered,
      recentItems: recent,
      categorizedItems: categories,
    };
  }, [query, recentCommands]);

  const totalItems = recentItems.length + filteredItems.length;

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % totalItems);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const allItems = [...recentItems, ...filteredItems];
        const selected = allItems[selectedIndex];
        if (selected) {
          handleSelect(selected.type);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, totalItems, recentItems, filteredItems, onClose]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Delay to avoid closing immediately when menu opens
    setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleSelect = (type: ContentBlockType) => {
    addRecentCommand(type);
    onSelect(type);
  };

  if (totalItems === 0) {
    return null;
  }

  let currentIndex = 0;

  return (
    <div
      ref={menuRef}
      className="absolute top-full left-0 mt-1 z-50 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl min-w-[320px] max-w-[380px] max-h-[400px] overflow-y-auto"
      style={position ? { top: position.top, left: position.left } : undefined}
    >
      {/* Recently Used Section */}
      {recentItems.length > 0 && (
        <div className="border-b border-zinc-800">
          <div className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
            Recently Used
          </div>
          {recentItems.map((item) => {
            const itemIndex = currentIndex++;
            const Icon = item.icon;
            return (
              <button
                key={`recent-${item.type}`}
                onClick={() => handleSelect(item.type)}
                className={`w-full flex items-start gap-3 px-3 py-2.5 text-left transition-colors ${
                  itemIndex === selectedIndex
                    ? "bg-blue-600 text-white"
                    : "hover:bg-zinc-800 text-zinc-100"
                }`}
                onMouseEnter={() => setSelectedIndex(itemIndex)}
              >
                <Icon
                  size={18}
                  className={`mt-0.5 flex-shrink-0 ${
                    itemIndex === selectedIndex ? "text-white" : "text-zinc-400"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{item.label}</div>
                  <div
                    className={`text-xs ${
                      itemIndex === selectedIndex ? "text-blue-200" : "text-zinc-500"
                    }`}
                  >
                    {item.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Categorized Items */}
      {Object.keys(categorizedItems).length > 0 ? (
        Object.entries(categorizedItems).map(([category, items]) => (
          <div key={category} className="border-b border-zinc-800 last:border-b-0">
            <div className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
              {category}
            </div>
            {items.map((item) => {
              const itemIndex = currentIndex++;
              const Icon = item.icon;
              return (
                <button
                  key={item.type}
                  onClick={() => handleSelect(item.type)}
                  className={`w-full flex items-start gap-3 px-3 py-2.5 text-left transition-colors ${
                    itemIndex === selectedIndex
                      ? "bg-blue-600 text-white"
                      : "hover:bg-zinc-800 text-zinc-100"
                  }`}
                  onMouseEnter={() => setSelectedIndex(itemIndex)}
                >
                  <Icon
                    size={18}
                    className={`mt-0.5 flex-shrink-0 ${
                      itemIndex === selectedIndex ? "text-white" : "text-zinc-400"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{item.label}</div>
                    <div
                      className={`text-xs ${
                        itemIndex === selectedIndex ? "text-blue-200" : "text-zinc-500"
                      }`}
                    >
                      {item.description}
                    </div>
                  </div>
                  {/* Keyboard hint for selected item */}
                  {itemIndex === selectedIndex && (
                    <div className="text-xs text-blue-200 mt-0.5">↵</div>
                  )}
                </button>
              );
            })}
          </div>
        ))
      ) : (
        <div className="px-3 py-8 text-center text-zinc-500 text-sm">
          No matching blocks found
        </div>
      )}

      {/* Footer hint */}
      <div className="px-3 py-2 text-xs text-zinc-600 border-t border-zinc-800 flex items-center justify-between">
        <span>↑↓ Navigate</span>
        <span>↵ Select</span>
        <span>Esc Close</span>
      </div>
    </div>
  );
}
