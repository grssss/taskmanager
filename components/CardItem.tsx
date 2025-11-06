"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { formatDistanceToNow, isAfter } from "date-fns";
import { Edit3, Link as LinkIcon, Trash2 } from "lucide-react";
import Link from "next/link";
import { Card, Category } from "@/lib/types";

type Props = {
  columnId: string;
  card: Card;
  categories: Category[];
  onEdit: () => void;
  onDelete: () => void;
};

export default function CardItem({ columnId, card, categories, onEdit, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: `card:${columnId}:${card.id}` });
  const style = { transform: CSS.Transform.toString(transform), transition } as React.CSSProperties;
  const cardCategories = categories.filter((c) => card.categoryIds?.includes(c.id));
  const createdAgo = formatDistanceToNow(new Date(card.createdAt), { addSuffix: true });
  const due = card.dueDate ? new Date(card.dueDate) : undefined;
  const overdue = due ? isAfter(new Date(), due) : false;

  return (
    <article ref={setNodeRef} style={style} {...attributes} {...listeners} className="group rounded-xl border border-black/10 bg-white p-3 shadow-sm transition-colors hover:bg-white/90 dark:bg-zinc-950 dark:border-white/10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{card.title}</h3>
          {card.description ? (
            <p className="mt-1 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">{card.description}</p>
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
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">Created {createdAgo}</span>
            {due ? (
              <span className={`rounded-full px-2 py-0.5 text-[10px] ${overdue ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"}`}>
                Due {due.toLocaleDateString()}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button onClick={onEdit} className="rounded-md p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800" aria-label="Edit"><Edit3 size={16} /></button>
          <button onClick={onDelete} className="rounded-md p-1 hover:bg-zinc-100 text-red-600 dark:hover:bg-zinc-800" aria-label="Delete"><Trash2 size={16} /></button>
        </div>
      </div>
      {card.links && card.links.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {card.links.map((l, i) => (
            <Link key={i} href={l.url} target="_blank" className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-1 text-[11px] text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700">
              <LinkIcon size={12} /> {l.label || l.url}
            </Link>
          ))}
        </div>
      ) : null}
    </article>
  );
}
