import { useEffect } from "react";

interface POSEventConfig {
  onPayment: () => void;
  onClear: () => void;
  onNavigateUp: () => void;
  onNavigateDown: () => void;
  onSearchFocus: () => void;
}

/**
 * Module 4: The Global Keyboard Shortcut Engine
 * Efficiently handles POS operations via keyboard.
 */
export function usePOSEvents(config: POSEventConfig) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isTyping = activeElement instanceof HTMLInputElement || 
                       activeElement instanceof HTMLTextAreaElement;

      // Allow shortcuts if not typing, OR if Alt/Cmd/Ctrl is pressed
      const isModifierPressed = e.altKey || e.metaKey || e.ctrlKey;
      
      if (isTyping && !isModifierPressed) return;

      // Cmd/Ctrl + K: Focus Search
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        config.onSearchFocus();
      }

      // Alt + P: Open Payment Modal / Checkout
      if (e.altKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        config.onPayment();
      }

      // Alt + C: Clear Cart
      if (e.altKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        config.onClear();
      }

      // Arrows: Navigate Cart (only if not typing or if Alt is held)
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        config.onNavigateUp();
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        config.onNavigateDown();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [config]);
}
