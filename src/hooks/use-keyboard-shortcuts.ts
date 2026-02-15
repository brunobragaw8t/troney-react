import { useCallback, useEffect } from "react";

interface KeyboardShortcut {
  key: string;
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

      if (event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) {
        return;
      }

      const shortcut = shortcuts.find((shortcut) => shortcut.key === event.key);

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
