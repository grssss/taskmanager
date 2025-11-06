"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragCancelEvent,
  DragOverlay,
  DropAnimation,
  KeyboardSensor,
  PointerSensor,
  defaultDropAnimation,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Plus, SlidersHorizontal, Tags } from "lucide-react";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { BoardState, Card, Column, Category, defaultState } from "@/lib/types";
import ColumnView from "@/components/ColumnView";
import ManageColumnsModal from "@/components/ManageColumnsModal";
import ManageCategoriesModal from "@/components/ManageCategoriesModal";
import UpsertCardModal from "@/components/UpsertCardModal";
import { CardPreview } from "@/components/CardItem";

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export default function Board() {
  const [state, setState] = useLocalStorage<BoardState>("kanban-state", defaultState());
  const [showColumns, setShowColumns] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [editingCard, setEditingCard] = useState<null | { id?: string; columnId?: string }>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [showHighPriorityOnly, setShowHighPriorityOnly] = useState(false);
  const [activeDragCard, setActiveDragCard] = useState<Card | null>(null);

  const columnIds = useMemo(() => state.columns.map((c) => c.id), [state.columns]);
  const categoryMap = useMemo(() => new Map(state.categories.map((c) => [c.id, c])), [state.categories]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const dropAnimation: DropAnimation = {
    ...defaultDropAnimation,
    duration: 220,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
  };

  useEffect(() => {
    setActiveFilters((prev) => prev.filter((id) => categoryMap.has(id)));
  }, [categoryMap]);

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const [type, fromColumnId, cardId] = String(active.id).split(":");
    const [overType, toColumnId, overCardId] = String(over.id).split(":");
    if (type !== "card" || (overType !== "card" && overType !== "column")) return;

    setState((prev) => {
      const fromIdx = prev.columns.findIndex((c) => c.id === fromColumnId);
      const toIdx = prev.columns.findIndex((c) => c.id === toColumnId);
      if (fromIdx < 0 || toIdx < 0) return prev;

      const from = { ...prev.columns[fromIdx] };
      const to = fromIdx === toIdx ? from : { ...prev.columns[toIdx] };

      // remove from source
      const currentIndex = from.cardIds.indexOf(cardId);
      if (currentIndex === -1) return prev;
      from.cardIds.splice(currentIndex, 1);

      // insert into target
      if (overType === "column") {
        to.cardIds.push(cardId);
      } else {
        const overIndex = to.cardIds.indexOf(overCardId);
        const at = overIndex === -1 ? to.cardIds.length : overIndex;
        to.cardIds.splice(at, 0, cardId);
      }

      const columns = [...prev.columns];
      columns[fromIdx] = from;
      columns[toIdx] = to;
      return { ...prev, columns };
    });
    setActiveDragCard(null);
  };

  const onDragStart = (event: DragStartEvent) => {
    const [type, , cardId] = String(event.active.id).split(":");
    if (type !== "card") return;
    const card = state.cards[cardId];
    if (card) setActiveDragCard(card);
  };

  const onDragCancel = (_event: DragCancelEvent) => {
    setActiveDragCard(null);
  };

  const handleCreate = (columnId: string) => setEditingCard({ columnId });

  const upsertCard = (columnId: string, card: Partial<Card> & { id?: string; title: string }) => {
    setState((prev) => {
      const id = card.id ?? uid();
      const existing = prev.cards[id];
      const createdAt = existing?.createdAt ?? new Date().toISOString();
      const fallbackCategory = existing && (existing as any).categoryId ? [(existing as any).categoryId as string] : [];
      const full: Card = {
        id,
        title: card.title,
        description: card.description ?? existing?.description ?? "",
        categoryIds: card.categoryIds ?? existing?.categoryIds ?? fallbackCategory,
        createdAt,
        dueDate: card.dueDate ?? existing?.dueDate,
        priority: card.priority ?? existing?.priority ?? "medium",
        links: card.links ?? existing?.links ?? [],
      };
      const cards = { ...prev.cards, [id]: full };
      let columns = prev.columns.map((c) => ({ ...c }));
      // ensure presence in target column
      const fromIdx = columns.findIndex((c) => c.cardIds.includes(id));
      if (fromIdx >= 0) columns[fromIdx].cardIds = columns[fromIdx].cardIds.filter((x) => x !== id);
      const toIdx = columns.findIndex((c) => c.id === columnId);
      if (toIdx >= 0 && !columns[toIdx].cardIds.includes(id)) columns[toIdx].cardIds.unshift(id);
      return { ...prev, cards, columns };
    });
    setEditingCard(null);
  };

  const deleteCard = (id: string) => {
    setState((prev) => {
      const cards = { ...prev.cards };
      delete cards[id];
      const columns = prev.columns.map((c) => ({ ...c, cardIds: c.cardIds.filter((x) => x !== id) }));
      return { ...prev, cards, columns };
    });
  };

  const saveColumns = (columns: Column[]) => setState((p) => ({ ...p, columns }));
  const saveCategories = (categories: Category[]) => setState((p) => ({ ...p, categories }));

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-8 pt-20">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Kanban</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Personal board with drag & drop</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCategories(true)} className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm transition-colors hover:text-zinc-900 hover:shadow dark:bg-zinc-900 dark:border-white/10 dark:text-zinc-200 dark:hover:text-white">
            <Tags size={16} /> Manage Categories
          </button>
          <button onClick={() => setShowColumns(true)} className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm transition-colors hover:text-zinc-900 hover:shadow dark:bg-zinc-900 dark:border-white/10 dark:text-zinc-200 dark:hover:text-white">
            <SlidersHorizontal size={16} /> Manage Columns
          </button>
        </div>
      </header>

      <section className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip
            selected={activeFilters.length === 0}
            label="All"
            onClick={() => setActiveFilters([])}
          />
          {state.categories.map((category) => (
            <FilterChip
              key={category.id}
              label={category.name}
              color={category.color}
              selected={activeFilters.includes(category.id)}
              onClick={() =>
                setActiveFilters((prev) =>
                  prev.includes(category.id)
                    ? prev.filter((id) => id !== category.id)
                    : [...prev, category.id],
                )
              }
            />
          ))}
        </div>
        <label className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm text-zinc-600 shadow-sm transition hover:border-black/20 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-white/20">
          <input
            type="checkbox"
            checked={showHighPriorityOnly}
            onChange={(event) => setShowHighPriorityOnly(event.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 text-black focus:ring-black dark:border-zinc-600 dark:bg-zinc-900 dark:text-white dark:focus:ring-white"
          />
          High priority only
        </label>
      </section>

      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
      >
        <div className="flex gap-4 overflow-x-auto pb-2">
          <SortableContext items={columnIds}>
            {state.columns.map((col) => (
              <div key={col.id} className="min-w-[320px] max-w-[360px] flex-1">
                <ColumnView
                  key={col.id}
                  column={col}
                  cards={col.cardIds
                    .map((id) => state.cards[id])
                    .filter(Boolean)
                    .filter((card) => {
                      if (!card) return false;
                      if (showHighPriorityOnly && !(card.priority === "high" || card.priority === "critical")) {
                        return false;
                      }
                      if (activeFilters.length === 0) return true;
                      const categoriesForCard =
                        card?.categoryIds ??
                        ((card as any)?.categoryId ? [(card as any).categoryId as string] : []);
                      if (!categoriesForCard || categoriesForCard.length === 0) return false;
                      return categoriesForCard.some((categoryId) => activeFilters.includes(categoryId));
                    })}
                  categories={state.categories}
                  onAdd={() => handleCreate(col.id)}
                  onEdit={(id) => setEditingCard({ id })}
                  onDelete={deleteCard}
                />
              </div>
            ))}
          </SortableContext>
        </div>
        <DragOverlay dropAnimation={dropAnimation}>
          {activeDragCard ? <CardPreview card={activeDragCard} categories={state.categories} /> : null}
        </DragOverlay>
      </DndContext>

      <UpsertCardModal
        open={!!editingCard}
        onClose={() => setEditingCard(null)}
        card={editingCard?.id ? state.cards[editingCard.id] : undefined}
        categories={state.categories}
        onSave={(data) =>
          upsertCard(
            editingCard?.columnId ?? findColumnContaining(state, editingCard?.id) ?? state.columns[0]?.id,
            data,
          )
        }
      />

      <ManageColumnsModal
        open={showColumns}
        onClose={() => setShowColumns(false)}
        columns={state.columns}
        onSave={saveColumns}
      />

      <ManageCategoriesModal
        open={showCategories}
        onClose={() => setShowCategories(false)}
        categories={state.categories}
        onSave={saveCategories}
      />
    </div>
  );
}

function findColumnContaining(state: BoardState, cardId?: string) {
  if (!cardId) return undefined;
  return state.columns.find((c) => c.cardIds.includes(cardId))?.id;
}

type FilterChipProps = {
  label: string;
  selected: boolean;
  onClick: () => void;
  color?: string;
};

function FilterChip({ label, selected, onClick, color }: FilterChipProps) {
  const baseColor = color ?? "#64748b";
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-all ${
        selected
          ? "bg-black text-white shadow dark:bg-white dark:text-black"
          : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
      }`}
      style={selected && color ? { backgroundColor: baseColor, color: "#fff" } : undefined}
    >
      {label}
    </button>
  );
}
