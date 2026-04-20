import { useEffect } from "react";

interface KeybindConfig {
  [key: string]: () => void;
}

/**
 * Task 4: Global Event Listener Engine (Keyboard Mastery)
 */
export function useKeybindEngine(config: KeybindConfig) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      const activeElement = document.activeElement;
      const isTyping = activeElement instanceof HTMLInputElement || 
                       activeElement instanceof HTMLTextAreaElement;
      
      // We only allow keybinds if NOT typing, OR if the Cmd/Alt key is pressed
      if (isTyping && !e.altKey && !e.metaKey && !e.ctrlKey) {
        return;
      }

      // Format: "Alt+P" or "P"
      let keyCombo = "";
      if (e.altKey) keyCombo += "Alt+";
      if (e.ctrlKey) keyCombo += "Ctrl+";
      if (e.metaKey) keyCombo += "Cmd+";
      keyCombo += e.key.toUpperCase();

      if (config[keyCombo]) {
        e.preventDefault();
        config[keyCombo]();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [config]);
}
