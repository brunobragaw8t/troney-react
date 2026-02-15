import { Button } from "@/components/ui/button/button";
import { AlertTriangle } from "lucide-react";
import { useCallback, useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { Keymap } from "../keymap/keymap";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "primary" | "danger-ghost";
  loading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary",
  loading = false,
}: ConfirmationModalProps) {
  const titleId = useId();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isOpen || loading) return;

      if (
        ["Enter", "y"].includes(event.key) &&
        !event.shiftKey &&
        !event.ctrlKey &&
        !event.altKey
      ) {
        event.preventDefault();
        event.stopPropagation();
        onConfirm();
      }

      if (
        ["Escape", "n"].includes(event.key) &&
        !event.shiftKey &&
        !event.ctrlKey &&
        !event.altKey
      ) {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    },
    [isOpen, onConfirm, onClose, loading],
  );

  const handleBackdropClick = useCallback(
    (event: React.MouseEvent) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onConfirm, onClose, loading]);

  if (!isOpen) return null;

  const elem = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-lg bg-secondary-1 p-6 shadow-xl outline-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id={titleId} className="text-xl font-semibold text-white">
            {title}
          </h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            {variant === "danger-ghost" && (
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
            )}

            <p className="text-secondary-4">{message}</p>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              label={cancelText}
              variant="primary-ghost"
              onClick={onClose}
              tooltip={
                <>
                  <Keymap text="n" /> / <Keymap text="Esc" />
                </>
              }
            />

            <Button
              type="button"
              label={confirmText}
              variant={variant}
              onClick={onConfirm}
              loading={loading}
              tooltip={
                <>
                  <Keymap text="y" /> / <Keymap text="Enter" />
                </>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(elem, document.body);
}
