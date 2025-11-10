"use client";

import { useEffect, useState } from "react";
import { Category } from "@/lib/types";
import { HexColorPicker } from "react-colorful";
import { Plus, X } from "lucide-react";
import Dialog from "./Dialog";

type Props = {
  open: boolean;
  categories: Category[];
  onSave: (categories: Category[]) => void;
  onClose: () => void;
};

export default function ManageCategoriesModal({ open, categories, onSave, onClose }: Props) {
  const [local, setLocal] = useState<Category[]>(categories);
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      setLocal(categories);
      setPickerFor(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [categories, open]);

  const add = () =>
    setLocal((existing) => {
      const name = `Category ${existing.length + 1}`;
      const id = createCategoryId(existing, name);
      const color = pickUniqueColor(existing);
      return [...existing, { id, name, color }];
    });
  const remove = (id: string) => {
    setLocal((l) => l.filter((c) => c.id !== id));
    setPickerFor((prev) => (prev === id ? null : prev));
  };
  const edit = (id: string, patch: Partial<Category>) => setLocal((l) => l.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  return (
    <Dialog open={open} onClose={onClose} title="Manage Categories" maxWidth="lg">
      <div className="space-y-2">
        {local.map((c) => (
          <div key={c.id} className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-900 p-2">
            <button
              className="h-6 w-6 shrink-0 rounded-full border border-white/10"
              style={{ backgroundColor: c.color || "#64748b" }}
              onClick={() => setPickerFor(pickerFor === c.id ? null : c.id)}
              aria-label="Pick color"
            />
            <input value={c.name} onChange={(e) => edit(c.id, { name: e.target.value })} className="flex-1 rounded-md bg-zinc-800 px-2 py-1 text-sm outline-none" />
            <button onClick={() => remove(c.id)} className="rounded-md p-1 text-red-600 hover:bg-zinc-800" aria-label="Remove"><X size={16} /></button>
          </div>
        ))}
        <div className="flex justify-between pt-2">
          <button onClick={add} className="inline-flex items-center gap-1 rounded-full bg-zinc-700 px-3 py-2 text-sm text-zinc-100"><Plus size={16} /> Add Category</button>
          <div className="space-x-2">
            <button onClick={onClose} className="rounded-full border border-white/10 bg-zinc-900 px-3 py-2 text-sm">Cancel</button>
            <button
              onClick={() => {
                onSave(assignFallbacks(local));
                onClose();
              }}
              className="rounded-full bg-zinc-700 px-3 py-2 text-sm text-zinc-100"
            >
              Save
            </button>
          </div>
        </div>
        {pickerFor ? (
          <div className="rounded-xl border border-white/10 bg-zinc-900 p-3">
            <HexColorPicker color={local.find((c) => c.id === pickerFor)?.color || "#64748b"} onChange={(v) => edit(pickerFor, { color: v })} />
          </div>
        ) : null}
      </div>
    </Dialog>
  );
}

function sanitizeName(name: string, index: number) {
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed : `Category ${index + 1}`;
}

function createCategoryId(existing: Category[], baseName: string) {
  const used = new Set(existing.map((c) => c.id));
  const base = slug(baseName) || randomId();
  let candidate = base;
  let suffix = 1;
  while (used.has(candidate)) {
    candidate = `${base}-${suffix++}`;
  }
  return candidate;
}

function assignFallbacks(categories: Category[]) {
  const usedColors = new Set<string>();
  return categories.map((category, idx) => {
    const name = sanitizeName(category.name, idx);
    const color = ensureColor(category.color, usedColors, idx);
    usedColors.add(color.toLowerCase());
    return { ...category, name, color };
  });
}

function ensureColor(color: string | undefined, used: Set<string>, seedIndex: number) {
  if (color) {
    const lowered = color.toLowerCase();
    if (!used.has(lowered)) {
      return color;
    }
  }
  let index = seedIndex;
  let next = generateColor(index);
  let attempts = 0;
  while (used.has(next.toLowerCase()) && attempts < 64) {
    index += 1;
    next = generateColor(index);
    attempts += 1;
  }
  if (used.has(next.toLowerCase())) {
    next = randomColor();
  }
  return next;
}

function pickUniqueColor(existing: Category[]) {
  const used = new Set(existing.map((c) => (c.color ?? "").toLowerCase()));
  let index = existing.length;
  let candidate = generateColor(index);
  let attempts = 0;
  while (used.has(candidate.toLowerCase()) && attempts < 64) {
    index += 1;
    candidate = generateColor(index);
    attempts += 1;
  }
  if (used.has(candidate.toLowerCase())) {
    candidate = randomColor();
  }
  return candidate;
}

function generateColor(index: number) {
  const goldenRatioConjugate = 0.61803398875;
  const hue = ((index * goldenRatioConjugate) % 1) * 360;
  return hslToHex(hue, 62, 55);
}

function randomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `cat-${Math.random().toString(36).slice(2, 10)}`;
}

function randomColor() {
  const random = Math.floor(Math.random() * 0xffffff);
  return `#${random.toString(16).padStart(6, "0")}`;
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function hslToHex(h: number, s: number, l: number) {
  const sat = s / 100;
  const light = l / 100;
  const chroma = sat * Math.min(light, 1 - light);
  const huePrime = h / 60;
  const x = chroma * (1 - Math.abs((huePrime % 2) - 1));
  const match = light - chroma;

  let r = 0;
  let g = 0;
  let b = 0;

  if (huePrime >= 0 && huePrime < 1) {
    r = chroma;
    g = x;
  } else if (huePrime < 2) {
    r = x;
    g = chroma;
  } else if (huePrime < 3) {
    g = chroma;
    b = x;
  } else if (huePrime < 4) {
    g = x;
    b = chroma;
  } else if (huePrime < 5) {
    r = x;
    b = chroma;
  } else {
    r = chroma;
    b = x;
  }

  const toHex = (value: number) => {
    const v = Math.round((value + match) * 255);
    return v.toString(16).padStart(2, "0");
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

