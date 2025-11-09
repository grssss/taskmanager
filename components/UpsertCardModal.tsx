"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, Category, Priority, ChecklistItem } from "@/lib/types";
import { Plus, Trash2, X, ChevronDown, ChevronUp } from "lucide-react";

type Props = {
  open: boolean;
  card?: Card;
  categories: Category[];
  onSave: (data: Partial<Card> & { title: string; id?: string }) => void;
  onClose: () => void;
};

export default function UpsertCardModal({ open, card, categories, onSave, onClose }: Props) {
  const [title, setTitle] = useState(card?.title ?? "");
  const fallbackCategory = card && (card as any).categoryId ? [(card as any).categoryId as string] : [];
  const [description, setDescription] = useState(card?.description ?? "");
  const [categoryIds, setCategoryIds] = useState<string[]>(card?.categoryIds ?? fallbackCategory);
  const [dueDate, setDueDate] = useState<string | undefined>(card?.dueDate);
  const [priority, setPriority] = useState<Priority>(card?.priority ?? "medium");
  const [links, setLinks] = useState(card?.links ?? []);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(card?.checklist ?? []);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  useEffect(() => {
    setTitle(card?.title ?? "");
    setDescription(card?.description ?? "");
    setCategoryIds(card?.categoryIds ?? (card && (card as any).categoryId ? [(card as any).categoryId as string] : []));
    setDueDate(card?.dueDate);
    setPriority(card?.priority ?? "medium");
    setLinks(card?.links ?? []);
    setChecklist(card?.checklist ?? []);
    setDescriptionExpanded(false);
  }, [card, open]);

  const valid = title.trim().length > 0;

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
          <div className="mb-1 flex items-center justify-between">
            <label className="block text-xs text-zinc-600 dark:text-zinc-400">Checklist</label>
            <button type="button" onClick={() => setChecklist((c) => [...c, { id: crypto.randomUUID(), text: "", checked: false }])} className="inline-flex items-center gap-1 rounded-full bg-black px-2 py-1 text-xs text-white dark:bg-white dark:text-black"><Plus size={14} /> Add</button>
          </div>
          <div className="space-y-2">
            {checklist.map((item, i) => (
              <div key={item.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={(e) => setChecklist((arr) => arr.map((x, idx) => idx === i ? { ...x, checked: e.target.checked } : x))}
                  className="h-4 w-4 shrink-0 cursor-pointer rounded border border-black/20 dark:border-white/20"
                />
                <input placeholder="Checklist item" value={item.text} onChange={(e) => setChecklist((arr) => arr.map((x, idx) => idx === i ? { ...x, text: e.target.value } : x))} className="flex-1 rounded-md bg-zinc-100 px-3 py-2 text-sm outline-none dark:bg-zinc-800" />
                <button type="button" onClick={() => setChecklist((arr) => arr.filter((_, idx) => idx !== i))} className="rounded-md p-1 text-red-600 hover:bg-zinc-100 dark:hover:bg-zinc-800" aria-label="Remove checklist item"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-zinc-600 dark:text-zinc-400">Categories</label>
            <div className="space-y-1 rounded-md bg-zinc-100 p-2 dark:bg-zinc-800">
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
            <input type="date" value={dueDate ? dueDate.slice(0,10) : ""} onChange={(e) => setDueDate(e.target.value ? new Date(e.target.value).toISOString() : undefined)} className="w-full rounded-md bg-zinc-100 px-3 py-2 text-sm outline-none dark:bg-zinc-800" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-600 dark:text-zinc-400">Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="w-full rounded-md bg-zinc-100 px-3 py-2 text-sm outline-none dark:bg-zinc-800">
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
            <button type="button" onClick={() => setLinks((l) => [...l, { label: "", url: "" }])} className="inline-flex items-center gap-1 rounded-full bg-black px-2 py-1 text-xs text-white dark:bg-white dark:text-black"><Plus size={14} /> Add</button>
          </div>
          <div className="space-y-2">
            {links.map((l, i) => (
              <div key={i} className="grid grid-cols-5 items-center gap-2">
                <input placeholder="Label" value={l.label} onChange={(e) => setLinks((arr) => arr.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))} className="col-span-2 rounded-md bg-zinc-100 px-3 py-2 text-sm outline-none dark:bg-zinc-800" />
                <input placeholder="https://" value={l.url} onChange={(e) => setLinks((arr) => arr.map((x, idx) => idx === i ? { ...x, url: e.target.value } : x))} className="col-span-3 rounded-md bg-zinc-100 px-3 py-2 text-sm outline-none dark:bg-zinc-800" />
                <button type="button" onClick={() => setLinks((arr) => arr.filter((_, idx) => idx !== i))} className="-ml-1 rounded-md p-1 text-red-600 hover:bg-zinc-100 dark:hover:bg-zinc-800" aria-label="Remove link"><Trash2 size={16} /></button>
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
                checklist: checklist.filter((item) => item.text.trim()),
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

function Dialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        // Close when clicking backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-2xl rounded-2xl border border-black/10 bg-white p-4 shadow-xl dark:bg-zinc-900 dark:border-white/10">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800" aria-label="Close"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
