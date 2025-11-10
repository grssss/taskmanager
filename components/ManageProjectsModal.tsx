"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Project } from "@/lib/types";
import { GripVertical, X } from "lucide-react";
import Dialog from "./Dialog";

type Props = {
  open: boolean;
  projects: Project[];
  activeProjectId: string;
  onSave: (projects: Project[], newActiveProjectId?: string) => void;
  onClose: () => void;
};

type SortableProjectItemProps = {
  project: Project;
  isActive: boolean;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
  canDelete: boolean;
};

function SortableProjectItem({ project, isActive, onRename, onRemove, canDelete }: SortableProjectItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: project.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-lg border p-2 ${
        isActive
          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30"
          : "border-white/10 bg-zinc-900"
      }`}
    >
      <button
        className="cursor-grab touch-none text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={18} />
      </button>
      <input
        value={project.name}
        onChange={(e) => onRename(project.id, e.target.value)}
        className="flex-1 rounded-md bg-zinc-800 px-2 py-1 text-sm outline-none"
      />
      {isActive && (
        <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Active</span>
      )}
      <button
        onClick={() => onRemove(project.id)}
        disabled={!canDelete}
        className={`rounded-md p-1 ${
          !canDelete
            ? "cursor-not-allowed text-zinc-300 dark:text-zinc-700"
            : "text-red-600 hover:bg-zinc-800"
        }`}
        aria-label="Delete"
        title={!canDelete ? "Cannot delete the last project" : "Delete project"}
      >
        <X size={16} />
      </button>
    </div>
  );
}

export default function ManageProjectsModal({ open, projects, activeProjectId, onSave, onClose }: Props) {
  const [local, setLocal] = useState<Project[]>(projects);
  const [localActiveId, setLocalActiveId] = useState(activeProjectId);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      setLocal(projects);
      setLocalActiveId(activeProjectId);
    });
    return () => cancelAnimationFrame(frame);
  }, [projects, activeProjectId, open]);

  const remove = (id: string) => {
    // Don't allow deleting the last project
    if (local.length <= 1) return;

    setLocal((l) => {
      const filtered = l.filter((p) => p.id !== id);
      // If we're deleting the active project, switch to the first remaining project
      if (id === localActiveId && filtered.length > 0) {
        setLocalActiveId(filtered[0].id);
      }
      return filtered;
    });
  };

  const rename = (id: string, name: string) => {
    setLocal((l) => l.map((p) => (p.id === id ? { ...p, name } : p)));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLocal((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSave = () => {
    // Make sure names are not empty
    const validProjects = local.map((p) => ({
      ...p,
      name: p.name.trim() || "Untitled Project",
    }));

    // Check if active project still exists
    const activeExists = validProjects.some((p) => p.id === localActiveId);
    const newActiveId = activeExists ? localActiveId : validProjects[0]?.id;

    onSave(validProjects, newActiveId);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} title="Manage Projects" maxWidth="lg">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={local.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {local.map((p) => (
              <SortableProjectItem
                key={p.id}
                project={p}
                isActive={p.id === localActiveId}
                onRename={rename}
                onRemove={remove}
                canDelete={local.length > 1}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <div className="flex justify-end pt-4">
        <div className="space-x-2">
          <button
            onClick={onClose}
            className="rounded-full border border-white/10 bg-zinc-900 px-3 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-full bg-zinc-700 px-3 py-2 text-sm text-zinc-100"
          >
            Save
          </button>
        </div>
      </div>
    </Dialog>
  );
}
