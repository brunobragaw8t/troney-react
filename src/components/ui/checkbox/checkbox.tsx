import type React from "react";
import { useId } from "react";

interface CheckboxProps {
  label: string;
  name: string;
  value: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function Checkbox({
  label,
  name,
  value,
  checked,
  onChange,
}: CheckboxProps) {
  const id = useId();

  return (
    <div className="flex items-start gap-2">
      <input
        type="checkbox"
        id={id}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="relative mt-1 h-3 w-3 shrink-0 appearance-none rounded-sm border border-secondary-4 outline-none after:absolute after:bottom-1/2 after:right-1/2 after:translate-x-1/2 after:translate-y-1/2 after:text-xs after:text-white after:opacity-0 after:content-['✓'] checked:border-primary-1 checked:bg-primary-1 checked:after:opacity-100 focus:ring-1 focus:ring-white"
      />

      <label htmlFor={id} className="text-sm font-medium text-secondary-4">
        {label}
      </label>
    </div>
  );
}
