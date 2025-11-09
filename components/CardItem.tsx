"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { isAfter, isToday, isYesterday, differenceInDays } from "date-fns";
import { Link as LinkIcon, Trash2 } from "lucide-react";
import Link from "next/link";
import { Card, Category, Priority, ChecklistItem } from "@/lib/types";

const PRIORITY_STYLES: Record<Priority, { label: string; className: string }> = {
  low: {
    label: "Low",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  medium: {
    label: "Medium",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  high: {
    label: "High",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  },
  critical: {
    label: "Critical",
    className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  },
};

type Props = {
  columnId: string;
  card: Card;
  categories: Category[];
  onEdit: () => void;
  onDelete: () => void;
};

type CardBodyProps = {
  card: Card;
  categories: Category[];
  onDelete?: () => void;
  showActions?: boolean;
};

function CardBody({ card, categories, onDelete, showActions = true }: CardBodyProps) {
  const cardCategories = categories.filter((c) => card.categoryIds?.includes(c.id));
  const cardCreatedDate = new Date(card.createdAt);

  let createdAgo: string;
  if (isToday(cardCreatedDate)) {
    createdAgo = "today";
  } else if (isYesterday(cardCreatedDate)) {
    createdAgo = "yesterday";
  } else {
    const daysAgo = differenceInDays(new Date(), cardCreatedDate);
    createdAgo = `${daysAgo} days ago`;
  }

  const due = card.dueDate ? new Date(card.dueDate) : undefined;
  const overdue = due ? isAfter(new Date(), due) : false;

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 break-words">{card.title}</h3>
          {card.status ? (
            <p className="mt-0.5 text-xs text-slate-600 dark:text-zinc-400 break-words">{card.status}</p>
          ) : null}
          {card.description ? (
            <p className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-zinc-400 break-words">{card.description}</p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-2">
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
            {cardCategories.length > 0 ? <span className="basis-full" aria-hidden /> : null}
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${PRIORITY_STYLES[card.priority].className}`}>
              {PRIORITY_STYLES[card.priority].label}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">Created {createdAgo}</span>
            {due ? (
              <span className={`rounded-full px-2 py-0.5 text-[10px] ${overdue ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"}`}>
                {due.toLocaleDateString()}
              </span>
            ) : null}
          </div>
        </div>
        {showActions ? (
          <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={(event) => {
                event.stopPropagation();
                onDelete?.();
              }}
              className="rounded-md p-1 hover:bg-red-50 text-red-600 transition-colors dark:hover:bg-zinc-800"
              aria-label="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ) : null}
      </div>
      {card.links && card.links.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {card.links.map((l, i) => (
            <Link key={i} href={l.url} target="_blank" className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-200 transition-colors dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 max-w-full">
              <LinkIcon size={12} className="shrink-0" /> <span className="truncate">{l.label || l.url}</span>
            </Link>
          ))}
        </div>
      ) : null}
    </>
  );
}

export default function CardItem({ columnId, card, categories, onEdit, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `card:${columnId}:${card.id}` });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? "transform 180ms cubic-bezier(0.2, 0, 0, 1)",
    cursor: isDragging ? "grabbing" : "grab",
    opacity: isDragging ? 0.4 : 1,
  } as React.CSSProperties;

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(event) => {
        event.stopPropagation();
        onEdit();
      }}
      className={`group rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 hover:shadow-md dark:bg-zinc-950 dark:border-zinc-700 dark:hover:bg-zinc-900/80 dark:hover:border-zinc-600 ${
        isDragging ? "ring-2 ring-indigo-500 shadow-lg dark:ring-indigo-400/60" : ""
      }`}
    >
      <CardBody card={card} categories={categories} onDelete={onDelete} />
    </article>
  );
}

type CardPreviewProps = {
  card: Card;
  categories: Category[];
};

export function CardPreview({ card, categories }: CardPreviewProps) {
  return (
    <article className="pointer-events-none w-full max-w-[360px] rounded-xl border border-slate-200 bg-white p-3 shadow-lg dark:bg-zinc-950 dark:border-zinc-700">
      <CardBody card={card} categories={categories} showActions={false} />
    </article>
  );
}
