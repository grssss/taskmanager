"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const current = theme === "system" ? systemTheme : theme;
  const isDark = current === "dark";

  return (
    <button
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm transition-all hover:text-zinc-900 hover:shadow md:px-4 dark:bg-zinc-900 dark:border-white/10 dark:text-zinc-200 dark:hover:text-white"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
      <span className="hidden md:inline">{isDark ? "Light" : "Dark"} mode</span>
    </button>
  );
}

