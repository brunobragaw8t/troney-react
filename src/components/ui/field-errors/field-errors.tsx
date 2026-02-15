import type React from "react";

interface FieldErrorProps {
  id: string;
  error?: string | string[];
}

export function FieldErrors({ id, error }: FieldErrorProps) {
  if (!error) return null;

  return (
    <p id={id} className="mt-1 text-xs text-red-400">
      {Array.isArray(error)
        ? error.map((e) => (
            <span className="block" key={e}>
              {e}
            </span>
          ))
        : error}
    </p>
  );
}
