import { useEffect } from 'react';

export interface KeyboardShortcutOptions {
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  key: string;
  onKeyDown: (event: KeyboardEvent) => void;
  enabled?: boolean;
  preventDefault?: boolean;
}

/**
 * Custom hook for registering keyboard shortcuts
 * @param options - Configuration for the keyboard shortcut
 */
export function useKeyboardShortcut(options: KeyboardShortcutOptions | KeyboardShortcutOptions[]) {
  useEffect(() => {
    const shortcuts = Array.isArray(options) ? options : [options];

    const handleKeyDown = (event: KeyboardEvent) => {
      shortcuts.forEach((shortcut) => {
        // Skip if disabled
        if (shortcut.enabled === false) return;

        // Check if the key matches
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();

        // Check modifiers (Ctrl/Cmd key is treated the same for cross-platform)
        const ctrlMatches = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : true;
        const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatches = shortcut.alt ? event.altKey : !event.altKey;

        // If all conditions match, execute the callback
        if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
          // Don't trigger if user is typing in an input (unless it's Enter or Escape)
          const target = event.target as HTMLElement;
          const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';

          // Allow Enter and Escape even in input fields
          if (isInputField && !['Enter', 'Escape'].includes(event.key)) {
            // Skip shortcuts when typing in input fields (unless it's a form submit shortcut)
            if (!shortcut.ctrl && !shortcut.alt) return;
          }

          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }

          shortcut.onKeyDown(event);
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [options]);
}

/**
 * Utility function to format keyboard shortcut for display
 */
export function formatShortcut(shortcut: Omit<KeyboardShortcutOptions, 'onKeyDown' | 'enabled' | 'preventDefault'>): string {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const parts: string[] = [];

  if (shortcut.ctrl) parts.push(isMac ? '⌘' : 'Ctrl');
  if (shortcut.shift) parts.push(isMac ? '⇧' : 'Shift');
  if (shortcut.alt) parts.push(isMac ? '⌥' : 'Alt');
  parts.push(shortcut.key.toUpperCase());

  return parts.join(isMac ? '' : '+');
}
