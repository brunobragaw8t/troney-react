import { useKeyboardShortcuts } from "../hooks/use-keyboard-shortcuts";
import { createContext, useCallback, useContext, useState } from "react";

const STORAGE_KEY = "balance-hidden";

interface BalanceVisibilityContextValue {
  isHidden: boolean;
  toggle: () => void;
}

const BalanceVisibilityContext =
  createContext<BalanceVisibilityContextValue | null>(null);

export function BalanceVisibilityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isHidden, setIsHidden] = useState(
    () => localStorage.getItem(STORAGE_KEY) === "true",
  );

  const toggle = useCallback(() => {
    setIsHidden((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  useKeyboardShortcuts({
    shortcuts: [{ key: "h", action: toggle }],
  });

  return (
    <BalanceVisibilityContext.Provider value={{ isHidden, toggle }}>
      {children}
    </BalanceVisibilityContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useBalanceVisibility() {
  const context = useContext(BalanceVisibilityContext);

  if (!context) {
    throw new Error(
      "useBalanceVisibility must be used within BalanceVisibilityProvider",
    );
  }

  return context;
}
