"use client";

import { useEffect, useState } from "react";
import { Column } from "@/lib/types";
import { ArrowDownAZ, ArrowUpZA, Plus, X } from "lucide-react";
import Dialog from "./Dialog";

type Props = {
  open: boolean;
  columns: Column[];
  onSave: (columns: Column[]) => void;
  onClose: () => void;
};

export default function ManageColumnsModal({ open, columns, onSave, onClose }: Props) {
  const [local, setLocal] = useState<Column[]>(columns);
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      setLocal(columns);
    });
    return () => cancelAnimationFrame(frame);
  }, [columns, open]);

  const add = () => setLocal((l) => [...l, { id: slug(`Column ${l.length + 1}`), name: `Column ${l.length + 1}`, cardIds: [] }]);
  const remove = (id: string) => setLocal((l) => l.filter((c) => c.id !== id));
  const rename = (id: string, name: string) => setLocal((l) => l.map((c) => (c.id === id ? { ...c, name } : c)));
  const move = (i: number, dir: -1 | 1) => setLocal((l) => {
    const next = [...l];
    const j = i + dir;
    if (j < 0 || j >= next.length) return l;
    const [it] = next.splice(i, 1);
    next.splice(j, 0, it);
    return next;
  });

  return (
    <Dialog open={open} onClose={onClose} title="Manage Columns" maxWidth="lg">
      <div className="space-y-2">
        {local.map((c, i) => (
          <div key={c.id} className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-900 p-2">
            <input value={c.name} onChange={(e) => rename(c.id, e.target.value)} className="flex-1 rounded-md bg-zinc-800 px-2 py-1 text-sm outline-none" />
            <button onClick={() => move(i, -1)} className="rounded-md p-1 hover:bg-zinc-800" aria-label="Up"><ArrowUpZA size={16} /></button>
            <button onClick={() => move(i, 1)} className="rounded-md p-1 hover:bg-zinc-800" aria-label="Down"><ArrowDownAZ size={16} /></button>
            <button onClick={() => remove(c.id)} className="rounded-md p-1 text-red-600 hover:bg-zinc-800" aria-label="Remove"><X size={16} /></button>
          </div>
        ))}
        <div className="flex justify-between pt-2">
          <button onClick={add} className="inline-flex items-center gap-1 rounded-full bg-zinc-700 px-3 py-2 text-sm text-zinc-100"><Plus size={16} /> Add Column</button>
          <div className="space-x-2">
            <button onClick={onClose} className="rounded-full border border-white/10 bg-zinc-900 px-3 py-2 text-sm">Cancel</button>
            <button onClick={() => { onSave(local.map((c) => ({ ...c, id: slug(c.name) }))); onClose(); }} className="rounded-full bg-zinc-700 px-3 py-2 text-sm text-zinc-100">Save</button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

