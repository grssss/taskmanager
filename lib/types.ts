export type Priority = "low" | "medium" | "high" | "critical";

export interface LinkItem {
  label: string;
  url: string;
  checklistItemId?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string; // MIME type
  url: string;
  uploadedAt: string;
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
  status?: string;
  checklist?: ChecklistItem[];
  files?: FileAttachment[];
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

export interface Project {
  id: string;
  name: string;
  board: BoardState;
}

export interface AppState {
  activeProjectId: string;
  projects: Project[];
}

export const defaultColumns: Column[] = [
  { id: "todo", name: "To Do", cardIds: [] },
  { id: "in-progress", name: "In Progress", cardIds: [] },
  { id: "done", name: "Done", cardIds: [] },
];

export const defaultState = (): BoardState => ({
  columns: defaultColumns.map((column) => ({
    ...column,
    cardIds: [...column.cardIds],
  })),
  cards: {},
  categories: [
    { id: "general", name: "General", color: "#64748b" },
  ],
});

export const defaultAppState = (): AppState => {
  const defaultProjectId = "project-default";
  return {
    activeProjectId: defaultProjectId,
    projects: [
      {
        id: defaultProjectId,
        name: "Personal",
        board: defaultState(),
      },
    ],
  };
};
