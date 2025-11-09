"use client";

import { X, Keyboard } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
};

type ShortcutGroup = {
  title: string;
  shortcuts: Array<{
    keys: string[];
    description: string;
  }>;
};

export default function KeyboardShortcutsHelp({ open, onClose }: Props) {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';

  const shortcutGroups: ShortcutGroup[] = [
    {
      title: "Global Shortcuts",
      shortcuts: [
        { keys: [modKey, 'N'], description: "Create new task" },
        { keys: [modKey, 'Shift', 'N'], description: "Create new project" },
        { keys: [modKey, 'K'], description: "Manage categories" },
        { keys: [modKey, 'Shift', 'K'], description: "Manage columns" },
        { keys: [modKey, 'P'], description: "Switch/manage projects" },
        { keys: [modKey, '/'], description: "Show this help dialog" },
      ],
    },
    {
      title: "In Dialogs/Modals",
      shortcuts: [
        { keys: ['Enter', modKey], description: "Save changes" },
        { keys: [modKey, 'S'], description: "Save changes" },
        { keys: ['Escape'], description: "Close dialog without saving" },
      ],
    },
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-black/10 bg-white p-6 shadow-xl dark:bg-zinc-900 dark:border-white/10">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard size={24} className="text-zinc-700 dark:text-zinc-300" />
            <h2 className="text-xl font-semibold">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          {shortcutGroups.map((group) => (
            <div key={group.title}>
              <h3 className="mb-3 text-sm font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border border-black/10 bg-zinc-50 px-4 py-3 dark:bg-zinc-800/50 dark:border-white/10"
                  >
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <span key={keyIndex} className="flex items-center gap-1">
                          <kbd className="min-w-[2rem] rounded border border-black/20 bg-white px-2 py-1 text-center text-xs font-semibold text-zinc-700 shadow-sm dark:bg-zinc-700 dark:border-white/20 dark:text-zinc-200">
                            {key}
                          </kbd>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="text-xs text-zinc-400">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-lg bg-blue-50 border border-blue-200 p-4 dark:bg-blue-950/30 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Tip:</strong> Press <kbd className="rounded border border-blue-300 bg-white px-2 py-0.5 text-xs font-semibold dark:bg-blue-900 dark:border-blue-700">{modKey}</kbd> + <kbd className="rounded border border-blue-300 bg-white px-2 py-0.5 text-xs font-semibold dark:bg-blue-900 dark:border-blue-700">/</kbd> anytime to view these shortcuts.
          </p>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-full bg-black px-4 py-2 text-sm text-white dark:bg-white dark:text-black"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
