"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, Category, Priority, ChecklistItem, FileAttachment } from "@/lib/types";
import { Plus, Trash2, ChevronDown, ChevronUp, Upload, FileText, Image as ImageIcon, File as FileIcon } from "lucide-react";
import { DndContext, DragEndEvent, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { uploadFile, deleteFile } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import Dialog from "./Dialog";

type Props = {
  open: boolean;
  card?: Card;
  categories: Category[];
  onSave: (data: Partial<Card> & { title: string; id?: string }) => void;
  onClose: () => void;
};

export default function UpsertCardModal({ open, card, categories, onSave, onClose }: Props) {
  const { user } = useAuth();
  const [title, setTitle] = useState(card?.title ?? "");
  const fallbackCategory = card && (card as any).categoryId ? [(card as any).categoryId as string] : [];
  const [description, setDescription] = useState(card?.description ?? "");
  const [categoryIds, setCategoryIds] = useState<string[]>(card?.categoryIds ?? fallbackCategory);
  const [dueDate, setDueDate] = useState<string | undefined>(card?.dueDate);
  const [priority, setPriority] = useState<Priority>(card?.priority ?? "medium");
  const [links, setLinks] = useState(card?.links ?? []);
  const [status, setStatus] = useState(card?.status ?? "");
  const [checklist, setChecklist] = useState<ChecklistItem[]>(card?.checklist ?? []);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [files, setFiles] = useState<FileAttachment[]>(card?.files ?? []);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleChecklistDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setChecklist((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  useEffect(() => {
    setTitle(card?.title ?? "");
    setDescription(card?.description ?? "");
    setCategoryIds(card?.categoryIds ?? (card && (card as any).categoryId ? [(card as any).categoryId as string] : []));
    setDueDate(card?.dueDate);
    setPriority(card?.priority ?? "medium");
    setLinks(card?.links ?? []);
    setStatus(card?.status ?? "");
    setChecklist(card?.checklist ?? []);
    setDescriptionExpanded(false);
    setFiles(card?.files ?? []);
    setUploadError(null);
  }, [card, open]);

  const valid = title.trim().length > 0;

  // File validation constants
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const MAX_FILES = 10;
  const ALLOWED_FILE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/rtf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || !user) return;

    setUploadError(null);

    // Validate file count
    if (files.length + selectedFiles.length > MAX_FILES) {
      setUploadError(`Maximum ${MAX_FILES} files allowed per card`);
      return;
    }

    const cardId = card?.id ?? crypto.randomUUID();

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];

      // Validate file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        setUploadError(`File type not allowed: ${file.name}`);
        continue;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setUploadError(`File too large (max 5MB): ${file.name}`);
        continue;
      }

      setUploading(true);

      try {
        const result = await uploadFile(user.id, cardId, file);

        if ('error' in result) {
          setUploadError(result.error);
        } else {
          const newFile: FileAttachment = {
            id: crypto.randomUUID(),
            name: file.name,
            size: file.size,
            type: file.type,
            url: result.url,
            uploadedAt: new Date().toISOString(),
          };
          setFiles((prev) => [...prev, newFile]);
        }
      } catch (err) {
        setUploadError(`Failed to upload ${file.name}`);
      } finally {
        setUploading(false);
      }
    }

    // Reset input
    e.target.value = '';
  };

  const handleFileDelete = async (fileToDelete: FileAttachment) => {
    // Extract path from URL (everything after the bucket name)
    const urlParts = fileToDelete.url.split('/');
    const bucketIndex = urlParts.indexOf('card-attachments');
    if (bucketIndex !== -1) {
      const filePath = urlParts.slice(bucketIndex + 1).join('/');
      await deleteFile(filePath);
    }
    setFiles((prev) => prev.filter((f) => f.id !== fileToDelete.id));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon size={16} />;
    if (type === 'application/pdf') return <FileText size={16} />;
    return <FileIcon size={16} />;
  };

  return (
    <Dialog open={open} onClose={onClose} title={card ? "Edit Task" : "New Task"}>
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs text-zinc-600 dark:text-zinc-400">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-md bg-zinc-100 px-3 py-2 text-sm outline-none dark:bg-zinc-800" />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="block text-xs text-zinc-600 dark:text-zinc-400">Description</label>
            {description && (
              <button
                type="button"
                onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                className="inline-flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                {descriptionExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {descriptionExpanded ? "Collapse" : "Expand"}
              </button>
            )}
          </div>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={descriptionExpanded ? 4 : 1} className="w-full resize-none rounded-md bg-zinc-100 px-3 py-2 text-sm outline-none dark:bg-zinc-800" />
        </div>

        <div>
          <label className="mb-1 block text-xs text-zinc-600 dark:text-zinc-400">Status:</label>
          <div className="flex items-center gap-2">
            <input
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="flex-1 rounded-md bg-zinc-100 px-3 py-2 text-sm outline-none dark:bg-zinc-800"
            />
            <button type="button" onClick={() => setChecklist((c) => [...c, { id: crypto.randomUUID(), text: "", checked: false }])} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300" aria-label="Add checklist item">
              <Plus size={18} />
            </button>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleChecklistDragEnd}>
            <SortableContext items={checklist.map((item) => item.id)} strategy={verticalListSortingStrategy}>
              <div className="mt-2 space-y-1.5">
                {checklist.map((item, i) => (
                  <SortableChecklistItem
                    key={item.id}
                    item={item}
                    index={i}
                    onCheck={(checked) => setChecklist((arr) => arr.map((x, idx) => idx === i ? { ...x, checked } : x))}
                    onTextChange={(text) => setChecklist((arr) => arr.map((x, idx) => idx === i ? { ...x, text } : x))}
                    onDelete={() => setChecklist((arr) => arr.filter((_, idx) => idx !== i))}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-zinc-600 dark:text-zinc-400">Categories</label>
            <div className="space-y-1 rounded-md bg-zinc-100 px-2 py-1 dark:bg-zinc-800">
              {categories.length === 0 ? (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">No categories yet.</p>
              ) : (
                categories.map((c) => {
                  const selected = categoryIds.includes(c.id);
                  return (
                    <label key={c.id} className="flex items-center gap-2 text-xs font-medium">
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 rounded border border-black/20 dark:border-white/20"
                        checked={selected}
                        onChange={() =>
                          setCategoryIds((ids) =>
                            ids.includes(c.id)
                              ? ids.filter((id) => id !== c.id)
                              : [...ids, c.id]
                          )
                        }
                      />
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5" style={{ backgroundColor: `${c.color ?? "#64748b"}20`, color: c.color ?? "#64748b" }}>
                        {c.name}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-600 dark:text-zinc-400">Due date</label>
            <input type="date" value={dueDate ? dueDate.slice(0,10) : ""} onChange={(e) => setDueDate(e.target.value ? new Date(e.target.value).toISOString() : undefined)} className="w-full rounded-md bg-zinc-100 px-3 py-0.5 text-sm outline-none dark:bg-zinc-800" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-600 dark:text-zinc-400">Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="w-full rounded-md bg-zinc-100 px-3 py-0.5 text-sm outline-none dark:bg-zinc-800">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="block text-xs text-zinc-600 dark:text-zinc-400">Links</label>
            <button type="button" onClick={() => setLinks((l) => [...l, { label: "", url: "" }])} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300" aria-label="Add link">
              <Plus size={18} />
            </button>
          </div>
          <div className="space-y-1.5">
            {links.map((l, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="grid grid-cols-5 flex-1 gap-2">
                  <input placeholder="Label" value={l.label} onChange={(e) => setLinks((arr) => arr.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))} className="col-span-2 rounded-md bg-zinc-100 px-3 py-0.5 text-sm outline-none dark:bg-zinc-800" />
                  <input placeholder="https://" value={l.url} onChange={(e) => setLinks((arr) => arr.map((x, idx) => idx === i ? { ...x, url: e.target.value } : x))} className="col-span-3 rounded-md bg-zinc-100 px-3 py-0.5 text-sm outline-none dark:bg-zinc-800" />
                </div>
                {checklist.length > 0 && (
                  <select
                    value={l.checklistItemId ?? ""}
                    onChange={(e) => setLinks((arr) => arr.map((x, idx) => idx === i ? { ...x, checklistItemId: e.target.value || undefined } : x))}
                    className="shrink-0 rounded-md bg-zinc-100 px-2 py-0.5 text-xs outline-none cursor-pointer text-zinc-600 dark:text-zinc-400 dark:bg-zinc-800"
                  >
                    <option value="">No status</option>
                    {checklist.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.text || 'Unnamed'}
                      </option>
                    ))}
                  </select>
                )}
                <button type="button" onClick={() => setLinks((arr) => arr.filter((_, idx) => idx !== i))} className="shrink-0 rounded-md p-0.5 text-red-600 hover:bg-zinc-100 dark:hover:bg-zinc-800" aria-label="Remove link"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="block text-xs text-zinc-600 dark:text-zinc-400">
              Files ({files.length}/{MAX_FILES})
            </label>
            <label className="cursor-pointer p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.pdf,.doc,.docx,.txt,.rtf,.xls,.xlsx,.csv"
                onChange={handleFileUpload}
                disabled={uploading || files.length >= MAX_FILES}
                className="hidden"
              />
              <Upload size={18} />
            </label>
          </div>
          {uploadError && (
            <div className="mb-2 rounded-md bg-red-100 px-3 py-2 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {uploadError}
            </div>
          )}
          {uploading && (
            <div className="mb-2 rounded-md bg-blue-100 px-3 py-2 text-xs text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
              Uploading...
            </div>
          )}
          <div className="space-y-1.5">
            {files.map((file) => (
              <div key={file.id} className="flex items-center gap-2 rounded-md bg-zinc-100 px-3 py-2 dark:bg-zinc-800">
                <div className="text-zinc-600 dark:text-zinc-400">
                  {getFileIcon(file.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate text-sm text-zinc-900 hover:text-blue-600 dark:text-zinc-100 dark:hover:text-blue-400"
                  >
                    {file.name}
                  </a>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    {formatFileSize(file.size)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleFileDelete(file)}
                  className="shrink-0 rounded-md p-0.5 text-red-600 hover:bg-zinc-200/60 dark:hover:bg-zinc-700"
                  aria-label="Remove file"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="rounded-full border border-black/10 bg-white px-3 py-2 text-sm dark:bg-zinc-900 dark:border-white/10">Cancel</button>
          <button
            disabled={!valid}
            onClick={() =>
              onSave({
                id: card?.id,
                title,
                description,
                categoryIds,
                dueDate,
                priority,
                links: links.filter((l) => l.url),
                status,
                checklist: checklist.filter((item) => item.text.trim()),
                files,
              })
            }
            className="rounded-full bg-black px-3 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-black"
          >
            Save
          </button>
        </div>
      </div>
    </Dialog>
  );
}

type SortableChecklistItemProps = {
  item: ChecklistItem;
  index: number;
  onCheck: (checked: boolean) => void;
  onTextChange: (text: string) => void;
  onDelete: () => void;
};

function SortableChecklistItem({ item, index, onCheck, onTextChange, onDelete }: SortableChecklistItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="flex items-center gap-2 rounded-md bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800 cursor-grab active:cursor-grabbing">
      <input
        type="checkbox"
        checked={item.checked}
        onChange={(e) => onCheck(e.target.checked)}
        className="h-3.5 w-3.5 shrink-0 cursor-pointer rounded border border-black/20 dark:border-white/20"
      />
      <input
        placeholder="Checklist item"
        value={item.text}
        onChange={(e) => onTextChange(e.target.value)}
        className={`flex-1 bg-transparent px-2 py-0.5 text-sm outline-none ${item.checked ? 'line-through text-zinc-400 dark:text-zinc-500' : ''}`}
      />
      <button
        type="button"
        onClick={onDelete}
        className="shrink-0 rounded-md p-0.5 text-red-600 hover:bg-zinc-200/60 dark:hover:bg-zinc-700"
        aria-label="Remove checklist item"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

