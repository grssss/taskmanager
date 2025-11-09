import { useState, useEffect } from 'react';

/**
 * Hook to track keyboard height on iOS using Visual Viewport API
 * Works with all keyboard types including Japanese IME with suggestion bars
 *
 * Returns the current keyboard height in pixels
 */
export function useKeyboardHeight(): number {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') return;

    // Check for Visual Viewport API support
    if (!window.visualViewport) {
      console.warn('Visual Viewport API not supported');
      return;
    }

    const updateKeyboardHeight = () => {
      const visualViewport = window.visualViewport;
      if (!visualViewport) return;

      // Calculate keyboard height as the difference between window height and visual viewport height
      // This accounts for the keyboard taking up screen space
      const windowHeight = window.innerHeight;
      const viewportHeight = visualViewport.height;
      const offsetTop = visualViewport.offsetTop || 0;

      // Keyboard height is the space below the visual viewport
      const height = Math.max(0, windowHeight - viewportHeight - offsetTop);

      setKeyboardHeight(height);
    };

    // Initial calculation
    updateKeyboardHeight();

    // Listen for viewport resize (keyboard show/hide, orientation change)
    window.visualViewport.addEventListener('resize', updateKeyboardHeight);
    window.visualViewport.addEventListener('scroll', updateKeyboardHeight);

    return () => {
      window.visualViewport?.removeEventListener('resize', updateKeyboardHeight);
      window.visualViewport?.removeEventListener('scroll', updateKeyboardHeight);
    };
  }, []);

  return keyboardHeight;
}

/**
 * Hook to get the visual viewport height (visible area excluding keyboard)
 * Useful for positioning elements that should appear above the keyboard
 */
export function useVisualViewportHeight(): number {
  const [viewportHeight, setViewportHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 0
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!window.visualViewport) {
      // Fallback to window height
      return;
    }

    const updateViewportHeight = () => {
      const visualViewport = window.visualViewport;
      if (visualViewport) {
        setViewportHeight(visualViewport.height);
      }
    };

    // Initial value
    updateViewportHeight();

    // Listen for changes
    window.visualViewport.addEventListener('resize', updateViewportHeight);
    window.visualViewport.addEventListener('scroll', updateViewportHeight);

    return () => {
      window.visualViewport?.removeEventListener('resize', updateViewportHeight);
      window.visualViewport?.removeEventListener('scroll', updateViewportHeight);
    };
  }, []);

  return viewportHeight;
}
