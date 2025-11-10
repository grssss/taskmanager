"use client";

import { useEffect, useRef, useState } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const loaded = useRef(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const raw = localStorage.getItem(key);
        if (raw) setValue(JSON.parse(raw));
      } catch {}
      loaded.current = true;
    });
    return () => cancelAnimationFrame(frame);
  }, [key]);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, [key, value]);

  return [value, setValue] as const;
}

