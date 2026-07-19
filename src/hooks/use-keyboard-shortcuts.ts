import { useCallback, useEffect } from "react";

interface KeyboardShortcut {
  key: string;
  shift?: boolean;
  action: (event?: KeyboardEvent) => void;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
}

export function useKeyboardShortcuts({
  shortcuts,
}: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (
        event.key !== "Escape" &&
        (document.activeElement instanceof HTMLInputElement ||
          document.activeElement instanceof HTMLTextAreaElement ||
          document.activeElement instanceof HTMLSelectElement)
      ) {
        return;
      }

      if (event.ctrlKey || event.altKey || event.metaKey) {
        return;
      }

      const shortcut = shortcuts.find(
        (s) =>
          s.key === event.key &&
          (s.shift ? event.shiftKey : !event.shiftKey),
      );

      if (shortcut) {
        event.preventDefault();
        shortcut.action(event);
      }
    },
    [shortcuts],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
