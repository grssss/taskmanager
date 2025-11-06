"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { Plus, SlidersHorizontal, Tags, Cloud, CloudOff, Loader2, FolderCog } from "lucide-react";
import { useSupabaseStorage } from "@/lib/useSupabaseStorage";
import {
  AppState,
  BoardState,
  Card,
  Category,
  Column,
  Project,
  defaultAppState,
  defaultState,
} from "@/lib/types";
import ColumnView from "@/components/ColumnView";
import ManageColumnsModal from "@/components/ManageColumnsModal";
import ManageCategoriesModal from "@/components/ManageCategoriesModal";
import UpsertCardModal from "@/components/UpsertCardModal";
import { CardPreview } from "@/components/CardItem";

const DEFAULT_PROJECT_NAME = "Personal";
const DEFAULT_MIGRATED_PROJECT_ID = "project-default";

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function isAppState(value: AppState | BoardState): value is AppState {
  return (
    value !== null &&
    typeof value === "object" &&
    "projects" in value &&
    Array.isArray((value as AppState).projects)
  );
}

function isBoardState(value: unknown): value is BoardState {
  if (!value || typeof value !== "object") return false;
  const maybe = value as BoardState;
  return Array.isArray(maybe.columns) && typeof maybe.cards === "object" && maybe.cards !== null;
}

function sanitizeBoardState(value: unknown): BoardState {
  if (!isBoardState(value)) {
    return defaultState();
  }

  const fallback = defaultState();
  const normalizedColumns =
    value.columns.length > 0
      ? value.columns.map((column) => ({
          id: column.id,
          name: column.name,
          cardIds: Array.isArray(column.cardIds) ? [...column.cardIds] : [],
        }))
      : fallback.columns;

  const normalizedCategories =
    value.categories && value.categories.length > 0
      ? value.categories.map((category) => ({ ...category }))
      : fallback.categories;

  const normalizedCards: Record<string, Card> = {};
  if (value.cards && typeof value.cards === "object") {
    for (const [id, card] of Object.entries(value.cards)) {
      if (!card || typeof card !== "object") continue;
      const cardValue = card as Card;
      normalizedCards[id] = {
        ...cardValue,
        categoryIds: Array.isArray(cardValue.categoryIds) ? [...cardValue.categoryIds] : cardValue.categoryIds,
        links: Array.isArray(cardValue.links) ? cardValue.links.map((link) => ({ ...link })) : cardValue.links,
      };
    }
  }

  return {
    columns: normalizedColumns,
    cards: normalizedCards,
    categories: normalizedCategories,
  };
}

function createProject(name: string, board: BoardState = defaultState(), id?: string): Project {
  return {
    id: id ?? `project-${uid()}`,
    name,
    board: sanitizeBoardState(board),
  };
}

export default function Board() {
  const initialAppState = useMemo(() => defaultAppState(), []);
  const [storedState, setStoredState, loadingStorage, syncStatus] = useSupabaseStorage<AppState>(
    "kanban-state",
    initialAppState,
  );
  const [showColumns, setShowColumns] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [editingCard, setEditingCard] = useState<null | { id?: string; columnId?: string }>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [showHighPriorityOnly, setShowHighPriorityOnly] = useState(false);
  const [activeDragCard, setActiveDragCard] = useState<Card | null>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    setStoredState((prev) => {
      if (isAppState(prev)) {
        if (prev.projects.length > 0) return prev;
        const fallbackProject = createProject(DEFAULT_PROJECT_NAME);
        return {
          ...prev,
          activeProjectId: fallbackProject.id,
          projects: [fallbackProject],
        };
      }
      const migratedProject = createProject(
        DEFAULT_PROJECT_NAME,
        sanitizeBoardState(prev),
        DEFAULT_MIGRATED_PROJECT_ID,
      );
      return {
        activeProjectId: migratedProject.id,
        projects: [migratedProject],
      };
    });
  }, [setStoredState]);

  const ready = isAppState(storedState) && storedState.projects.length > 0;
  const appState: AppState = ready ? (storedState as AppState) : defaultAppState();
  const activeProject =
    appState.projects.find((project) => project.id === appState.activeProjectId) ?? appState.projects[0];
  const board = activeProject.board;
  const lastCheckedProjectId = useRef<string | null>(null);

  useEffect(() => {
    if (!isAppState(storedState) || storedState.projects.length === 0) return;

    // Only check if activeProjectId has changed
    if (lastCheckedProjectId.current === storedState.activeProjectId) return;
    lastCheckedProjectId.current = storedState.activeProjectId;

    if (storedState.projects.some((project) => project.id === storedState.activeProjectId)) return;

    setStoredState((prev) => {
      if (!isAppState(prev) || prev.projects.length === 0) return prev;
      if (prev.projects.some((project) => project.id === prev.activeProjectId)) return prev;
      return { ...prev, activeProjectId: prev.projects[0].id };
    });
  }, [storedState.activeProjectId, setStoredState]);

  const columnIds = useMemo(() => board.columns.map((column) => column.id), [board.columns]);
  const categoryMap = useMemo(
    () => new Map(board.categories.map((category) => [category.id, category])),
    [board.categories],
  );
  const activeFiltersSafe = useMemo(
    () => activeFilters.filter((id) => categoryMap.has(id)),
    [activeFilters, categoryMap],
  );
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const dropAnimation: DropAnimation = {
    ...defaultDropAnimation,
    duration: 220,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
  };

  const updateActiveBoard = (updater: (current: BoardState) => BoardState) => {
    setStoredState((prev) => {
      if (!isAppState(prev)) return prev;
      const projectIndex = prev.projects.findIndex((project) => project.id === prev.activeProjectId);
      if (projectIndex === -1) return prev;

      const project = prev.projects[projectIndex];
      const updatedBoard = updater(project.board);
      if (updatedBoard === project.board) return prev;

      const projects = [...prev.projects];
      projects[projectIndex] = { ...project, board: updatedBoard };

      return { ...prev, projects };
    });
  };

  const handleSelectProject = (projectId: string) => {
    const willChange = ready && appState.activeProjectId !== projectId;
    setStoredState((prev) => {
      if (!isAppState(prev)) return prev;
      if (prev.activeProjectId === projectId) return prev;
      if (!prev.projects.some((project) => project.id === projectId)) return prev;
      return { ...prev, activeProjectId: projectId };
    });
    if (willChange) {
      setEditingCard(null);
      setActiveDragCard(null);
      setActiveFilters([]);
    }
  };

  const handleAddProject = () => {
    const name = typeof window !== "undefined" ? window.prompt("Project name", "New project") : null;
    const trimmed = name?.trim();
    if (!trimmed) return;

    const newProject = createProject(trimmed);
    setStoredState((prev) => {
      if (!isAppState(prev)) return prev;
      return {
        ...prev,
        activeProjectId: newProject.id,
        projects: [...prev.projects, newProject],
      };
    });
    setEditingCard(null);
    setActiveDragCard(null);
    setActiveFilters([]);
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

    updateActiveBoard((prev) => {
      const fromIdx = prev.columns.findIndex((column) => column.id === fromColumnId);
      const toIdx = prev.columns.findIndex((column) => column.id === toColumnId);
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

  const upsertCard = (columnId: string, card: Partial<Card> & { id?: string; title: string }) => {
    updateActiveBoard((prev) => {
      const id = card.id ?? uid();
      const existing = prev.cards[id];
      const createdAt = existing?.createdAt ?? new Date().toISOString();
      const fallbackCategory =
        existing && (existing as { categoryId?: string }).categoryId
          ? [((existing as { categoryId?: string }).categoryId as string)]
          : [];
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
      const columns = prev.columns.map((column) => ({ ...column }));
      const fromIdx = columns.findIndex((column) => column.cardIds.includes(id));
      if (fromIdx >= 0) {
        columns[fromIdx].cardIds = columns[fromIdx].cardIds.filter((cardId) => cardId !== id);
      }
      const toIdx = columns.findIndex((column) => column.id === columnId);
      if (toIdx >= 0 && !columns[toIdx].cardIds.includes(id)) {
        columns[toIdx].cardIds.unshift(id);
      }
      return { ...prev, cards, columns };
    });
    setEditingCard(null);
  };

  const deleteCard = (id: string) => {
    updateActiveBoard((prev) => {
      const cards = { ...prev.cards };
      delete cards[id];
      const columns = prev.columns.map((column) => ({
        ...column,
        cardIds: column.cardIds.filter((cardId) => cardId !== id),
      }));
      return { ...prev, cards, columns };
    });
  };

  const saveColumns = (columns: Column[]) => {
    updateActiveBoard((prev) => ({ ...prev, columns }));
  };

  const saveCategories = (categories: Category[]) => {
    updateActiveBoard((prev) => ({ ...prev, categories }));
  };


  if (!ready || loadingStorage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-8 pt-20">
      <header className="mb-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <label
            htmlFor="project-select"
            className="text-sm font-medium text-zinc-600 dark:text-zinc-300"
          >
            Projects
          </label>
          <select
            id="project-select"
            value={appState.activeProjectId}
            onChange={(event) => handleSelectProject(event.target.value)}
            className="h-10 min-w-[200px] rounded-full border border-black/10 bg-white px-3 text-sm text-zinc-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-black/30 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200 dark:focus:ring-white/40"
          >
            {appState.projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {/* TODO: Implement manage projects modal */}}
            className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm transition-colors hover:text-zinc-900 hover:shadow dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:text-white"
          >
            <FolderCog size={16} /> Manage Projects
          </button>
          <button
            type="button"
            onClick={handleAddProject}
            className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white p-2 text-zinc-700 shadow-sm transition-colors hover:text-zinc-900 hover:shadow dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:text-white"
            title="New Project"
          >
            <Plus size={16} />
          </button>

          {/* Sync Status Indicator */}
          <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2 text-sm text-zinc-700 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200">
            {syncStatus.syncing ? (
              <>
                <Loader2 size={16} className="animate-spin text-blue-500" />
                <span>Syncing...</span>
              </>
            ) : syncStatus.error ? (
              <>
                <CloudOff size={16} className="text-red-500" />
                <span className="text-red-600 dark:text-red-400" title={syncStatus.error}>
                  Sync failed
                </span>
              </>
            ) : syncStatus.lastSynced ? (
              <>
                <Cloud size={16} className="text-green-500" />
                <span className="text-green-600 dark:text-green-400">Synced</span>
              </>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{activeProject.name}</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Each project keeps its own kanban board.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowCategories(true)}
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm transition-colors hover:text-zinc-900 hover:shadow dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:text-white"
            >
              <Tags size={16} /> Manage Categories
            </button>
            <button
              onClick={() => setShowColumns(true)}
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm transition-colors hover:text-zinc-900 hover:shadow dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:text-white"
            >
              <SlidersHorizontal size={16} /> Manage Columns
            </button>
          </div>
        </div>
      </header>


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

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={onDragCancel}>
        <div className="flex gap-4 overflow-x-auto pb-2">
          <SortableContext items={columnIds}>
            {board.columns.map((column) => (
              <div key={column.id} className="min-w-[320px] max-w-[360px] flex-1">
                <ColumnView
                  key={column.id}
                  column={column}
                  cards={column.cardIds
                    .map((cardId) => board.cards[cardId])
                    .filter(Boolean)
                    .filter((card) => {
                      if (!card) return false;

                      // Priority filter
                      if (showHighPriorityOnly && !(card.priority === "high" || card.priority === "critical")) {
                        return false;
                      }

                      // Category filter
                      if (activeFiltersSafe.length > 0) {
                        const categoriesForCard =
                          card.categoryIds ??
                          ((card as unknown as { categoryId?: string }).categoryId
                            ? [((card as unknown as { categoryId?: string }).categoryId as string)]
                            : []);
                        if (!categoriesForCard || categoriesForCard.length === 0) return false;
                        if (!categoriesForCard.some((categoryId) => activeFiltersSafe.includes(categoryId))) {
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
          {activeDragCard ? <CardPreview card={activeDragCard} categories={board.categories} /> : null}
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
            findColumnContaining(board, editingCard?.id) ??
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

function findColumnContaining(state: BoardState, cardId?: string) {
  if (!cardId) return undefined;
  return state.columns.find((column) => column.cardIds.includes(cardId))?.id;
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
