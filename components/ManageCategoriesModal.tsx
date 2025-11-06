"use client";

import { useEffect, useState } from "react";
import { Category } from "@/lib/types";
import { HexColorPicker } from "react-colorful";
import { Plus, X } from "lucide-react";

type Props = {
  open: boolean;
  categories: Category[];
  onSave: (categories: Category[]) => void;
  onClose: () => void;
};

export default function ManageCategoriesModal({ open, categories, onSave, onClose }: Props) {
  const [local, setLocal] = useState<Category[]>(categories);
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  useEffect(() => { setLocal(categories); setPickerFor(null); }, [categories, open]);

  const add = () => setLocal((l) => [...l, { id: slug(`Category ${l.length + 1}`), name: `Category ${l.length + 1}`, color: "#64748b" }]);
  const remove = (id: string) => setLocal((l) => l.filter((c) => c.id !== id));
  const edit = (id: string, patch: Partial<Category>) => setLocal((l) => l.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  return (
    <Dialog open={open} onClose={onClose} title="Manage Categories">
      <div className="space-y-2">
        {local.map((c) => (
          <div key={c.id} className="flex items-center gap-2 rounded-lg border border-black/10 bg-white p-2 dark:bg-zinc-900 dark:border-white/10">
            <button
              className="h-6 w-6 shrink-0 rounded-full border border-black/10 dark:border-white/10"
              style={{ backgroundColor: c.color || "#64748b" }}
              onClick={() => setPickerFor(pickerFor === c.id ? null : c.id)}
              aria-label="Pick color"
            />
            <input value={c.name} onChange={(e) => edit(c.id, { name: e.target.value })} className="flex-1 rounded-md bg-zinc-100 px-2 py-1 text-sm outline-none dark:bg-zinc-800" />
            <button onClick={() => remove(c.id)} className="rounded-md p-1 text-red-600 hover:bg-zinc-100 dark:hover:bg-zinc-800" aria-label="Remove"><X size={16} /></button>
          </div>
        ))}
        <div className="flex justify-between pt-2">
          <button onClick={add} className="inline-flex items-center gap-1 rounded-full bg-black px-3 py-2 text-sm text-white dark:bg-white dark:text-black"><Plus size={16} /> Add Category</button>
          <div className="space-x-2">
            <button onClick={onClose} className="rounded-full border border-black/10 bg-white px-3 py-2 text-sm dark:bg-zinc-900 dark:border-white/10">Cancel</button>
            <button onClick={() => { onSave(local.map((c) => ({ ...c, id: slug(c.name) }))); onClose(); }} className="rounded-full bg-black px-3 py-2 text-sm text-white dark:bg-white dark:text-black">Save</button>
          </div>
        </div>
        {pickerFor ? (
          <div className="rounded-xl border border-black/10 bg-white p-3 dark:bg-zinc-900 dark:border-white/10">
            <HexColorPicker color={local.find((c) => c.id === pickerFor)?.color || "#64748b"} onChange={(v) => edit(pickerFor, { color: v })} />
          </div>
        ) : null}
      </div>
    </Dialog>
  );
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function Dialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-black/10 bg-white p-4 shadow-xl dark:bg-zinc-900 dark:border-white/10">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800" aria-label="Close"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

