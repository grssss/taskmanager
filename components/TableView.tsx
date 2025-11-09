"use client";

import { useState, useMemo } from "react";
import { Card, Category, Column } from "@/lib/types";
import { isAfter, isToday, isYesterday, differenceInDays } from "date-fns";
import { ArrowUp, ArrowDown, Edit2, Trash2, Link as LinkIcon, FileText, Image as ImageIcon, File as FileIcon } from "lucide-react";
import Link from "next/link";

type SortField = "title" | "status" | "priority" | "dueDate" | "createdAt" | "column";
type SortDirection = "asc" | "desc";

const PRIORITY_ORDER = { low: 0, medium: 1, high: 2, critical: 3 };
const PRIORITY_LABELS = { low: "Low", medium: "Medium", high: "High", critical: "Critical" };
const PRIORITY_STYLES = {
  low: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  high: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  critical: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return <ImageIcon size={10} />;
  if (type === 'application/pdf') return <FileText size={10} />;
  return <FileIcon size={10} />;
};

interface TableViewProps {
  columns: Column[];
  cards: Record<string, Card>;
  categories: Category[];
  onEdit: (cardId: string) => void;
  onDelete: (cardId: string) => void;
  activeFilters?: string[];
  showHighPriorityOnly?: boolean;
}

export default function TableView({
  columns,
  cards,
  categories,
  onEdit,
  onDelete,
  activeFilters = [],
  showHighPriorityOnly = false
}: TableViewProps) {
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories]
  );

  const columnMap = useMemo(
    () => new Map(columns.map((column) => [column.id, column])),
    [columns]
  );

  // Get all cards with their column information and apply filters
  const allCardsWithColumn = useMemo(() => {
    const result: Array<{ card: Card; columnId: string; columnName: string }> = [];
    columns.forEach((column) => {
      column.cardIds.forEach((cardId) => {
        const card = cards[cardId];
        if (!card) return;

        // Priority filter
        if (showHighPriorityOnly && !(card.priority === "high" || card.priority === "critical")) {
          return;
        }

        // Category filter
        if (activeFilters.length > 0) {
          const categoriesForCard = card.categoryIds ?? [];
          if (categoriesForCard.length === 0) return;
          if (!categoriesForCard.some((categoryId) => activeFilters.includes(categoryId))) {
            return;
          }
        }

        result.push({ card, columnId: column.id, columnName: column.name });
      });
    });
    return result;
  }, [columns, cards, activeFilters, showHighPriorityOnly]);

  // Sort cards
  const sortedCards = useMemo(() => {
    const sorted = [...allCardsWithColumn];
    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "title":
          comparison = a.card.title.localeCompare(b.card.title);
          break;
        case "status":
          comparison = (a.card.status || "").localeCompare(b.card.status || "");
          break;
        case "priority":
          comparison = PRIORITY_ORDER[a.card.priority] - PRIORITY_ORDER[b.card.priority];
          break;
        case "dueDate":
          const aDate = a.card.dueDate ? new Date(a.card.dueDate).getTime() : Infinity;
          const bDate = b.card.dueDate ? new Date(b.card.dueDate).getTime() : Infinity;
          comparison = aDate - bDate;
          break;
        case "createdAt":
          comparison = new Date(a.card.createdAt).getTime() - new Date(b.card.createdAt).getTime();
          break;
        case "column":
          comparison = a.columnName.localeCompare(b.columnName);
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
    return sorted;
  }, [allCardsWithColumn, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ArrowUp size={14} className="inline ml-1" />
    ) : (
      <ArrowDown size={14} className="inline ml-1" />
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return date.toLocaleDateString();
  };

  const formatCreatedAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "today";
    if (isYesterday(date)) return "yesterday";
    const daysAgo = differenceInDays(new Date(), date);
    return `${daysAgo}d ago`;
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-950">
      <table className="w-full text-sm">
        <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-black/10 dark:border-white/10">
          <tr>
            <th
              className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              onClick={() => handleSort("title")}
            >
              Title <SortIcon field="title" />
            </th>
            <th
              className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              onClick={() => handleSort("column")}
            >
              Column <SortIcon field="column" />
            </th>
            <th
              className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              onClick={() => handleSort("status")}
            >
              Status <SortIcon field="status" />
            </th>
            <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
              Categories
            </th>
            <th
              className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              onClick={() => handleSort("priority")}
            >
              Priority <SortIcon field="priority" />
            </th>
            <th
              className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              onClick={() => handleSort("dueDate")}
            >
              Due Date <SortIcon field="dueDate" />
            </th>
            <th
              className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              onClick={() => handleSort("createdAt")}
            >
              Created <SortIcon field="createdAt" />
            </th>
            <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
              Links
            </th>
            <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
              Files
            </th>
            <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
              Checklist
            </th>
            <th className="px-4 py-3 text-right font-medium text-zinc-700 dark:text-zinc-300">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedCards.length === 0 ? (
            <tr>
              <td colSpan={11} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
                No cards to display
              </td>
            </tr>
          ) : (
            sortedCards.map(({ card, columnName }) => {
              const cardCategories = categories.filter((c) => card.categoryIds?.includes(c.id));
              const due = card.dueDate ? new Date(card.dueDate) : undefined;
              const overdue = due ? isAfter(new Date(), due) : false;
              const checkedCount = card.checklist?.filter((item) => item.checked).length || 0;
              const totalCount = card.checklist?.length || 0;

              return (
                <tr
                  key={card.id}
                  className="border-b border-black/5 dark:border-white/5 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer group"
                  onClick={() => onEdit(card.id)}
                >
                  <td className="px-4 py-3 max-w-xs">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                      {card.title}
                    </div>
                    {card.description && (
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                        {card.description}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs text-zinc-700 dark:text-zinc-300">
                      {columnName}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-zinc-700 dark:text-zinc-300 text-xs">
                      {card.status || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {cardCategories.map((category) => (
                        <span
                          key={category.id}
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]"
                          style={{
                            backgroundColor: `${category.color ?? "#64748b"}20`,
                            color: category.color ?? "#64748b",
                          }}
                        >
                          {category.name}
                        </span>
                      ))}
                      {cardCategories.length === 0 && (
                        <span className="text-zinc-400 dark:text-zinc-500 text-xs">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${PRIORITY_STYLES[card.priority]}`}>
                      {PRIORITY_LABELS[card.priority]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {due ? (
                      <span
                        className={`text-xs ${
                          overdue
                            ? "text-red-600 dark:text-red-400 font-medium"
                            : "text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        {formatDate(card.dueDate!)}
                      </span>
                    ) : (
                      <span className="text-zinc-400 dark:text-zinc-500 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">
                      {formatCreatedAgo(card.createdAt)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {card.links && card.links.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {card.links.slice(0, 2).map((link, i) => (
                          <Link
                            key={i}
                            href={link.url}
                            target="_blank"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                          >
                            <LinkIcon size={10} /> {link.label || "Link"}
                          </Link>
                        ))}
                        {card.links.length > 2 && (
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                            +{card.links.length - 2}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-zinc-400 dark:text-zinc-500 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {card.files && card.files.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {card.files.slice(0, 2).map((file) => (
                          <a
                            key={file.id}
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                          >
                            {getFileIcon(file.type)} {file.name}
                          </a>
                        ))}
                        {card.files.length > 2 && (
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                            +{card.files.length - 2}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-zinc-400 dark:text-zinc-500 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {totalCount > 0 ? (
                      <span className="text-xs text-zinc-700 dark:text-zinc-300">
                        {checkedCount}/{totalCount}
                      </span>
                    ) : (
                      <span className="text-zinc-400 dark:text-zinc-500 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(card.id);
                        }}
                        className="rounded-md p-1.5 hover:bg-zinc-100 text-zinc-600 dark:hover:bg-zinc-800 dark:text-zinc-300"
                        aria-label="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(card.id);
                        }}
                        className="rounded-md p-1.5 hover:bg-zinc-100 text-red-600 dark:hover:bg-zinc-800"
                        aria-label="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
