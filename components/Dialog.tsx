"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
};

export default function Dialog({
  open,
  onClose,
  title,
  children,
  maxWidth = "2xl"
}: DialogProps) {
  const [mouseDownTarget, setMouseDownTarget] = useState<EventTarget | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Handle animation timing
  useEffect(() => {
    if (open) {
      // Small delay to trigger animation
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else {
      setIsVisible(false);
    }
  }, [open]);

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl"
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ease-out ${
        isVisible ? 'bg-black/70 backdrop-blur-md' : 'bg-black/0 backdrop-blur-none'
      }`}
      onMouseDown={(e) => {
        setMouseDownTarget(e.target);
      }}
      onClick={(e) => {
        // Only close if both mousedown and click occurred on the backdrop
        if (e.target === e.currentTarget && mouseDownTarget === e.currentTarget) {
          onClose();
        }
        setMouseDownTarget(null);
      }}
    >
      <div
        className={`w-full ${maxWidthClasses[maxWidth]} transform transition-all duration-300 ease-out ${
          isVisible
            ? 'scale-100 opacity-100 translate-y-0'
            : 'scale-90 opacity-0 -translate-y-8'
        }`}
      >
        <div className="relative rounded-3xl border border-zinc-200/50 bg-white p-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] dark:bg-zinc-900 dark:border-zinc-700/50 dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30 dark:from-blue-950/20 dark:via-zinc-900 dark:to-purple-950/20 pointer-events-none" />

          {/* Subtle animated border glow */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10 opacity-50 pointer-events-none" />

          <div className="relative">
            <div className="mb-5 flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-700/50 pb-4">
              <h3 className="text-xl font-semibold bg-gradient-to-br from-zinc-900 to-zinc-700 dark:from-zinc-50 dark:to-zinc-300 bg-clip-text text-transparent">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-zinc-400 transition-all duration-200 hover:bg-zinc-100 hover:text-zinc-700 hover:rotate-90 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
