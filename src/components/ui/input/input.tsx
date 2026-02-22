import { cn } from "../../../lib/utils";
import type { IconBaseProps } from "react-icons";
import type React from "react";
import { useEffect, useId, useRef } from "react";
import { FieldLabel } from "../field-label/field-label";
import { FieldErrors } from "../field-errors/field-errors";

interface InputProps {
  label?: string;
  icon?: React.ComponentType<IconBaseProps>;
  type: "text" | "email" | "password" | "date";
  name: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  autoFocus?: boolean;
  rightAccessoryIcon?: React.ComponentType<IconBaseProps>;
  rightAccessoryAction?: (ref: HTMLInputElement) => void;
  rightAccessoryLabel?: string;
  error?: string | string[];
  disabled?: boolean;
}

export function Input(props: InputProps) {
  const id = useId();
  const errorId = useId();
  const elRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (props.autoFocus && elRef.current) {
      elRef.current.focus();
    }
  }, [props.autoFocus]);

  function handleRightAccessoryAction() {
    if (props.rightAccessoryAction && elRef.current) {
      props.rightAccessoryAction(elRef.current);
    }
  }

  return (
    <div>
      {props.label && <FieldLabel htmlFor={id} label={props.label} />}

      <div className="relative">
        {props.icon && (
          <div className="pointer-events-none absolute left-0 top-0 flex h-full items-center pl-3 text-secondary-4">
            <props.icon size={16} />
          </div>
        )}

        <input
          ref={elRef}
          id={id}
          type={props.type}
          name={props.name}
          value={props.value}
          onChange={props.onChange}
          placeholder={props.placeholder}
          className={cn(
            "w-full rounded-lg border border-transparent bg-secondary-3 py-2 text-white placeholder-secondary-4 outline-none focus:border-white",
            props.icon ? "pl-10" : "pl-3",
            props.rightAccessoryIcon ? "pr-10" : "pr-3",
            props.error && "border-red-400",
            props.disabled && "cursor-not-allowed opacity-50",
          )}
          aria-invalid={props.error ? "true" : "false"}
          aria-describedby={props.error ? errorId : undefined}
          disabled={props.disabled}
        />

        {props.rightAccessoryIcon && (
          <button
            type="button"
            className="absolute right-1 top-1 flex items-center rounded-lg border border-transparent p-2 text-secondary-4 outline-none focus:border-white"
            onClick={handleRightAccessoryAction}
            aria-label={props.rightAccessoryLabel}
            title={props.rightAccessoryLabel}
          >
            <props.rightAccessoryIcon size={16} />
          </button>
        )}
      </div>

      <FieldErrors id={errorId} error={props.error} />
    </div>
  );
}
