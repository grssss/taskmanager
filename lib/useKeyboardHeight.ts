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
 * Hook to get visual viewport metrics (visible height + offset)
 * Useful for positioning UI that needs to hug the keyboard on mobile browsers
 */
export interface VisualViewportMetrics {
  height: number;
  offsetTop: number;
}

export function useVisualViewportMetrics(): VisualViewportMetrics {
  const [metrics, setMetrics] = useState<VisualViewportMetrics>(() => ({
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    offsetTop: 0,
  }));

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateMetrics = () => {
      const visualViewport = window.visualViewport;
      if (visualViewport) {
        setMetrics({
          height: visualViewport.height,
          offsetTop: visualViewport.offsetTop ?? 0,
        });
      } else {
        setMetrics({
          height: window.innerHeight,
          offsetTop: 0,
        });
      }
    };

    // Initial value
    updateMetrics();

    // Listen for changes
    window.visualViewport?.addEventListener('resize', updateMetrics);
    window.visualViewport?.addEventListener('scroll', updateMetrics);

    return () => {
      window.visualViewport?.removeEventListener('resize', updateMetrics);
      window.visualViewport?.removeEventListener('scroll', updateMetrics);
    };
  }, []);

  return metrics;
}

/**
 * Legacy helper that exposes only the viewport height
 */
export function useVisualViewportHeight(): number {
  const { height } = useVisualViewportMetrics();
  return height;
}
