"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DropAnimation,
  KeyboardSensor,
  PointerSensor,
  defaultDropAnimation,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { SlidersHorizontal, Tags } from "lucide-react";
import {
  WorkspaceState,
  Page,
  Card,
  Category,
  Column,
  BoardState,
} from "@/lib/types";
import { updateDatabaseConfig } from "@/lib/pageUtils";
import ColumnView from "@/components/ColumnView";
import ManageColumnsModal from "@/components/ManageColumnsModal";
import ManageCategoriesModal from "@/components/ManageCategoriesModal";
import UpsertCardModal from "@/components/UpsertCardModal";
import { CardPreview } from "@/components/CardItem";

interface DatabasePageViewProps {
  page: Page & { databaseConfig: NonNullable<Page["databaseConfig"]> };
  workspaceState: WorkspaceState;
  onStateChange: (state: WorkspaceState) => void;
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export default function DatabasePageView({
  page,
  workspaceState,
  onStateChange,
}: DatabasePageViewProps) {
  const board = page.databaseConfig.boardState;
  const [showColumns, setShowColumns] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [editingCard, setEditingCard] = useState<null | {
    id?: string;
    columnId?: string;
  }>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [showHighPriorityOnly, setShowHighPriorityOnly] = useState(false);
  const [activeDragCard, setActiveDragCard] = useState<Card | null>(null);

  const columnIds = board.columns.map((column) => column.id);
  const categoryMap = new Map(
    board.categories.map((category) => [category.id, category])
  );
  const activeFiltersSafe = activeFilters.filter((id) => categoryMap.has(id));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const dropAnimation: DropAnimation = {
    ...defaultDropAnimation,
    duration: 220,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
  };

  const updateBoard = (updater: (current: BoardState) => BoardState) => {
    const updatedBoard = updater(board);
    const newState = updateDatabaseConfig(workspaceState, page.id, {
      boardState: updatedBoard,
    });
    onStateChange(newState);
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      setActiveDragCard(null);
      return;
    }

    const [type, fromColumnId, cardId] = String(active.id).split(":");
    const [overType, toColumnId, overCardId] = String(over.id).split(":");

    if (type !== "card" || (overType !== "card" && overType !== "column")) {
      setActiveDragCard(null);
      return;
    }

    updateBoard((prev) => {
      const fromIdx = prev.columns.findIndex((col) => col.id === fromColumnId);
      const toIdx = prev.columns.findIndex((col) => col.id === toColumnId);
      if (fromIdx < 0 || toIdx < 0) return prev;

      const from = { ...prev.columns[fromIdx] };
      const to = fromIdx === toIdx ? from : { ...prev.columns[toIdx] };

      const currentIndex = from.cardIds.indexOf(cardId);
      if (currentIndex === -1) return prev;
      from.cardIds.splice(currentIndex, 1);

      if (overType === "column") {
        to.cardIds.push(cardId);
      } else {
        const overIndex = to.cardIds.indexOf(overCardId);
        const insertAt = overIndex === -1 ? to.cardIds.length : overIndex;
        to.cardIds.splice(insertAt, 0, cardId);
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
    const card = board.cards[cardId];
    if (card) setActiveDragCard(card);
  };

  const onDragCancel = () => {
    setActiveDragCard(null);
  };

  const handleCreate = (columnId: string) => setEditingCard({ columnId });

  const upsertCard = (
    columnId: string,
    card: Partial<Card> & { id?: string; title: string }
  ) => {
    updateBoard((prev) => {
      const id = card.id ?? uid();
      const existing = prev.cards[id];
      const createdAt = existing?.createdAt ?? new Date().toISOString();

      const full: Card = {
        id,
        title: card.title,
        description: card.description ?? existing?.description ?? "",
        categoryIds: card.categoryIds ?? existing?.categoryIds ?? [],
        createdAt,
        dueDate: card.dueDate ?? existing?.dueDate,
        priority: card.priority ?? existing?.priority ?? "medium",
        links: card.links ?? existing?.links ?? [],
        status: card.status ?? existing?.status ?? "",
        checklist: card.checklist ?? existing?.checklist ?? [],
        files: card.files ?? existing?.files ?? [],
      };

      const cards = { ...prev.cards, [id]: full };
      const columns = prev.columns.map((col) => ({ ...col }));

      const fromIdx = columns.findIndex((col) => col.cardIds.includes(id));
      if (fromIdx >= 0) {
        columns[fromIdx].cardIds = columns[fromIdx].cardIds.filter(
          (cardId) => cardId !== id
        );
      }

      const toIdx = columns.findIndex((col) => col.id === columnId);
      if (toIdx >= 0 && !columns[toIdx].cardIds.includes(id)) {
        columns[toIdx].cardIds.unshift(id);
      }

      return { ...prev, cards, columns };
    });
    setEditingCard(null);
  };

  const deleteCard = (id: string) => {
    updateBoard((prev) => {
      const cards = { ...prev.cards };
      delete cards[id];
      const columns = prev.columns.map((col) => ({
        ...col,
        cardIds: col.cardIds.filter((cardId) => cardId !== id),
      }));
      return { ...prev, cards, columns };
    });
  };

  const saveColumns = (columns: Column[]) => {
    updateBoard((prev) => ({ ...prev, columns }));
  };

  const saveCategories = (categories: Category[]) => {
    updateBoard((prev) => ({ ...prev, categories }));
  };

  const findColumnContaining = (cardId?: string) => {
    if (!cardId) return undefined;
    return board.columns.find((col) => col.cardIds.includes(cardId))?.id;
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-8 pt-6 bg-transparent">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {page.title}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowCategories(true)}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 shadow-sm transition-colors hover:text-zinc-100 hover:shadow"
          >
            <Tags size={16} /> Manage Categories
          </button>
          <button
            onClick={() => setShowColumns(true)}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 shadow-sm transition-colors hover:text-zinc-100 hover:shadow"
          >
            <SlidersHorizontal size={16} /> Manage Columns
          </button>
        </div>
      </div>

      {/* Filters */}
      <section className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip
            selected={activeFiltersSafe.length === 0}
            label="All"
            onClick={() => setActiveFilters([])}
          />
          {board.categories.map((category) => (
            <FilterChip
              key={category.id}
              label={category.name}
              color={category.color}
              selected={activeFiltersSafe.includes(category.id)}
              onClick={() =>
                setActiveFilters((prev) => {
                  const sanitized = prev.filter((id) => categoryMap.has(id));
                  return sanitized.includes(category.id)
                    ? sanitized.filter((id) => id !== category.id)
                    : [...sanitized, category.id];
                })
              }
            />
          ))}
        </div>
        <label className="flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 shadow-sm transition hover:border-white/20">
          <input
            type="checkbox"
            checked={showHighPriorityOnly}
            onChange={(e) => setShowHighPriorityOnly(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-white focus:ring-white"
          />
          High priority only
        </label>
      </section>

      {/* Content */}
      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
      >
        <div className="flex gap-4 overflow-x-auto pb-2">
          <SortableContext items={columnIds}>
            {board.columns.map((column) => (
              <div
                key={column.id}
                className="min-w-[320px] max-w-[360px] flex-1"
              >
                <ColumnView
                  column={column}
                  cards={column.cardIds
                    .map((cardId) => board.cards[cardId])
                    .filter(Boolean)
                    .filter((card) => {
                      if (
                        showHighPriorityOnly &&
                        !(
                          card.priority === "high" ||
                          card.priority === "critical"
                        )
                      ) {
                        return false;
                      }

                      if (activeFiltersSafe.length > 0) {
                        const categoriesForCard = card.categoryIds ?? [];
                        if (categoriesForCard.length === 0) return false;
                        if (
                          !categoriesForCard.some((categoryId) =>
                            activeFiltersSafe.includes(categoryId)
                          )
                        ) {
                          return false;
                        }
                      }

                      return true;
                    })}
                  categories={board.categories}
                  onAdd={() => handleCreate(column.id)}
                  onEdit={(id) => setEditingCard({ id })}
                  onDelete={deleteCard}
                />
              </div>
            ))}
          </SortableContext>
        </div>
        <DragOverlay dropAnimation={dropAnimation}>
          {activeDragCard ? (
            <CardPreview card={activeDragCard} categories={board.categories} />
          ) : null}
        </DragOverlay>
      </DndContext>

      <UpsertCardModal
        open={!!editingCard}
        onClose={() => setEditingCard(null)}
        card={editingCard?.id ? board.cards[editingCard.id] : undefined}
        categories={board.categories}
        onSave={(data) => {
          const targetColumnId =
            editingCard?.columnId ??
            findColumnContaining(editingCard?.id) ??
            board.columns[0]?.id;
          if (!targetColumnId) {
            setEditingCard(null);
            return;
          }
          upsertCard(targetColumnId, data);
        }}
      />

      <ManageColumnsModal
        open={showColumns}
        onClose={() => setShowColumns(false)}
        columns={board.columns}
        onSave={saveColumns}
      />

      <ManageCategoriesModal
        open={showCategories}
        onClose={() => setShowCategories(false)}
        categories={board.categories}
        onSave={saveCategories}
      />
    </div>
  );
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
          ? "bg-zinc-700 text-zinc-200 shadow"
          : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
      }`}
      style={
        selected && color ? { backgroundColor: baseColor, color: "#fff" } : undefined
      }
    >
      {label}
    </button>
  );
}
