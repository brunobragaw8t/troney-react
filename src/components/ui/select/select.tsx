import { cn } from "@/lib/utils";
import type { LucideProps } from "lucide-react";
import { ChevronDown } from "lucide-react";
import type React from "react";
import { useEffect, useId, useRef } from "react";
import { FieldLabel } from "../field-label/field-label";
import { FieldErrors } from "../field-errors/field-errors";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  icon?: React.ComponentType<LucideProps>;
  name: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  placeholder?: string;
  options: SelectOption[];
  autoFocus?: boolean;
  error?: string | string[];
  disabled?: boolean;
}

export function Select(props: SelectProps) {
  const id = useId();
  const errorId = useId();
  const elRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (props.autoFocus && elRef.current) {
      elRef.current.focus();
    }
  }, [props.autoFocus]);

  const iconClassName =
    "pointer-events-none absolute top-0 flex h-full items-center text-secondary-4";

  return (
    <div>
      {props.label && <FieldLabel htmlFor={id} label={props.label} />}

      <div className="relative">
        {props.icon && (
          <div className={cn(iconClassName, "left-0 pl-3")}>
            <props.icon size={16} />
          </div>
        )}

        <select
          ref={elRef}
          id={id}
          name={props.name}
          value={props.value}
          onChange={props.onChange}
          className={cn(
            "w-full cursor-pointer appearance-none rounded-lg border border-transparent bg-secondary-3 py-2 text-white outline-none focus:border-white",
            props.icon ? "pl-10" : "pl-3",
            "pr-10",
            props.error && "border-red-400",
            props.disabled && "cursor-not-allowed opacity-50",
            !props.value && "text-secondary-4",
          )}
          aria-invalid={props.error ? "true" : "false"}
          aria-describedby={props.error ? errorId : undefined}
          disabled={props.disabled}
        >
          {props.placeholder && (
            <option value="" disabled hidden>
              {props.placeholder}
            </option>
          )}

          {props.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <div className={cn(iconClassName, "right-0 pr-3")}>
          <ChevronDown size={16} />
        </div>
      </div>

      <FieldErrors id={errorId} error={props.error} />
    </div>
  );
}
