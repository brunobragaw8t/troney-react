import type React from "react";

interface FieldLabelProps {
  htmlFor: string;
  label: string;
}

export function FieldLabel({ htmlFor, label }: FieldLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-sm font-medium text-white"
    >
      {label}
    </label>
  );
}
