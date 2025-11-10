"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  if (!mounted) return null;

  const current = theme === "system" ? systemTheme : theme;
  const isDark = current === "dark";

  return (
    <button
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 hover:shadow-md md:px-4 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:hover:border-zinc-600 dark:hover:text-white"
    >
      {isDark ? <Sun size={16} className="transition-transform hover:rotate-12" /> : <Moon size={16} className="transition-transform hover:-rotate-12" />}
      <span className="hidden md:inline">{isDark ? "Light" : "Dark"} mode</span>
    </button>
  );
}
