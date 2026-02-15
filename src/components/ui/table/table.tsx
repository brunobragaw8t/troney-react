import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { cn } from "@/lib/utils";
import {
  createContext,
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type TableRowActions = {
  [key: string]: (rowIndex: number) => void;
};

const TableContext = createContext<{
  focusedRow: number | null;
  setFocusedRow: Dispatch<SetStateAction<number | null>>;
}>({
  focusedRow: null,
  setFocusedRow: () => {},
});

export function Table({
  numberOfRows,
  className,
  children,
  ...props
}: React.ComponentProps<"table"> & { numberOfRows: number }) {
  const [focusedRow, setFocusedRow] = useState<number | null>(null);

  const goUp = useCallback(() => {
    setFocusedRow((prev) => {
      if (prev === null) {
        return 0;
      }

      return Math.max(prev - 1, 0);
    });
  }, []);

  const goDown = useCallback(() => {
    setFocusedRow((prev) => {
      if (prev === null) {
        return 0;
      }

      return Math.min(prev + 1, numberOfRows - 1);
    });
  }, [numberOfRows]);

  useKeyboardShortcuts({
    shortcuts: useMemo(
      () => [
        { key: "ArrowUp", action: goUp },
        { key: "k", action: goUp },
        { key: "ArrowDown", action: goDown },
        { key: "j", action: goDown },
      ],
      [goUp, goDown],
    ),
  });

  const contextValue = {
    focusedRow,
    setFocusedRow,
  };

  return (
    <TableContext.Provider value={contextValue}>
      <div className="overflow-hidden rounded-lg border border-secondary-3 bg-secondary-2 text-left text-secondary-4">
        <table className={cn("w-full", className)} {...props}>
          {children}
        </table>
      </div>
    </TableContext.Provider>
  );
}

export function TableHead({
  className,
  children,
  ...props
}: React.ComponentProps<"thead">) {
  return (
    <thead
      className={cn("border-b border-secondary-3 bg-secondary-3/25", className)}
      {...props}
    >
      {children}
    </thead>
  );
}

export function TableBody({
  className,
  children,
  ...props
}: React.ComponentProps<"tbody">) {
  return (
    <tbody className={cn("", className)} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({
  rowIndex,
  actions,
  className,
  children,
  ...props
}: React.ComponentProps<"tr"> & {
  rowIndex?: number;
  actions?: TableRowActions;
}) {
  const { focusedRow, setFocusedRow } = useContext(TableContext);

  const handleMouseEnter = useCallback(() => {
    if (rowIndex === undefined) return;
    setFocusedRow(rowIndex);
  }, [rowIndex, setFocusedRow]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (
        rowIndex === undefined ||
        rowIndex !== focusedRow ||
        !actions ||
        actions[event.key] === undefined
      ) {
        return;
      }

      if (event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) {
        return;
      }

      actions[event.key](rowIndex);
    },
    [rowIndex, focusedRow, actions],
  );

  useEffect(() => {
    // Only add event listener if this row is focused and has actions
    if (rowIndex === focusedRow && actions) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [rowIndex, focusedRow, actions, handleKeyDown]);

  return (
    <tr
      className={cn(
        `border-b border-secondary-3 last:border-0 ${focusedRow === rowIndex && "bg-primary-1/5"}`,
        className,
      )}
      onMouseEnter={handleMouseEnter}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHeader({
  className,
  children,
  ...props
}: React.ComponentProps<"th">) {
  return (
    <th className={cn("px-4 py-2 text-white", className)} {...props}>
      {children}
    </th>
  );
}

export function TableCell({
  className,
  children,
  ...props
}: React.ComponentProps<"td">) {
  return (
    <td className={cn("px-4 py-2", className)} {...props}>
      {children}
    </td>
  );
}
