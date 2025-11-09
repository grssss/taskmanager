"use client";

import { useMemo } from "react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { Card, Category, Column } from "@/lib/types";
import CardItem from "@/components/CardItem";

type Props = {
  column: Column;
  cards: Card[];
  categories: Category[];
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

export default function ColumnView({ column, cards, categories, onAdd, onEdit, onDelete }: Props) {
  const { setNodeRef } = useDroppable({ id: `column:${column.id}:drop` });
  const itemIds = useMemo(() => cards.map((c) => `card:${column.id}:${c.id}`), [cards, column.id]);

  return (
    <section className="rounded-2xl border border-white/10 bg-zinc-900/60 p-3 shadow-sm backdrop-blur">
      <header className="mb-2 flex items-center justify-between px-1">
        <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{column.name}</h2>
        <button onClick={onAdd} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300" aria-label="Add card">
          <Plus size={18} />
        </button>
      </header>
      <div ref={setNodeRef} className="min-h-32 space-y-2 rounded-xl px-1 pb-6 pt-1.5">
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <CardItem key={card.id} columnId={column.id} card={card} categories={categories} onEdit={() => onEdit(card.id)} onDelete={() => onDelete(card.id)} />
          ))}
        </SortableContext>
      </div>
    </section>
  );
}

