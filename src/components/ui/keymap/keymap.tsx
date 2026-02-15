import { cn } from "@/lib/utils";

interface KeymapProps {
  text: string;
  className?: string;
}

export function Keymap({ text, className }: KeymapProps) {
  return (
    <span
      className={cn(
        "ml-auto min-w-5 rounded bg-secondary-3 px-1.5 py-0.5 text-center text-xs text-secondary-4",
        className,
      )}
    >
      {text}
    </span>
  );
}
