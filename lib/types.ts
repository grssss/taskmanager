export type Priority = "low" | "medium" | "high" | "critical";

export interface LinkItem {
  label: string;
  url: string;
}

export interface Card {
  id: string;
  title: string;
  description?: string;
  categoryIds?: string[];
  createdAt: string; // ISO date
  dueDate?: string; // ISO date
  priority: Priority;
  links?: LinkItem[];
}

export interface Column {
  id: string;
  name: string;
  cardIds: string[];
}

export interface Category {
  id: string;
  name: string;
  color?: string;
}

export interface BoardState {
  columns: Column[];
  cards: Record<string, Card>;
  categories: Category[];
}

export const defaultColumns: Column[] = [
  { id: "todo", name: "To Do", cardIds: [] },
  { id: "in-progress", name: "In Progress", cardIds: [] },
  { id: "done", name: "Done", cardIds: [] },
];

export const defaultState = (): BoardState => ({
  columns: defaultColumns,
  cards: {},
  categories: [
    { id: "general", name: "General", color: "#64748b" },
  ],
});
