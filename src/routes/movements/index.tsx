import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { useCallback, useMemo, useState } from "react";
import { LuCirclePlus, LuPencilLine, LuTrash } from "react-icons/lu";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Alert, type AlertProps } from "../../components/ui/alert/alert";
import { Button } from "../../components/ui/button/button";
import { ConfirmationModal } from "../../components/ui/confirmation-modal/confirmation-modal";
import { Currency } from "../../components/ui/currency/currency";
import { Keymap } from "../../components/ui/keymap/keymap";
import { Spinner } from "../../components/ui/spinner/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  type TableRowActions,
} from "../../components/ui/table/table";
import { useKeyboardShortcuts } from "../../hooks/use-keyboard-shortcuts";

export const Route = createFileRoute("/movements/")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();

  useKeyboardShortcuts({
    shortcuts: useMemo(
      () => [
        {
          key: "n",
          action: () => {
            navigate({ to: "/movements/create" });
          },
        },
      ],
      [navigate],
    ),
  });

  const [alert, setAlert] = useState<AlertProps>({
    type: "error",
    message: "",
  });

  const movements = useQuery(api.movements.getMovements);

  const handleEdit = useCallback(
    (index: number) => {
      if (!movements) return;
      navigate({ to: `/movements/${movements[index]._id}/edit` });
    },
    [navigate, movements],
  );

  const deleteMovement = useMutation(api.movements.deleteMovement);
  const [deletionModalOpen, setDeletionModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [movementToDelete, setMovementToDelete] = useState<{
    id: Id<"movements">;
    source: string;
    target: string;
  } | null>(null);

  const handleDelete = useCallback(
    (index: number) => {
      if (!movements) return;
      const movement = movements[index];
      setMovementToDelete({
        id: movement._id,
        source: movement.sourceWalletName,
        target: movement.targetWalletName,
      });
      setDeletionModalOpen(true);
    },
    [movements],
  );

  const handleCancelDelete = useCallback(() => {
    setDeletionModalOpen(false);
    setMovementToDelete(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!movementToDelete) return;

    setIsDeleting(true);
    setAlert({ type: "error", message: "" });

    try {
      await deleteMovement({ id: movementToDelete.id });
      setDeletionModalOpen(false);
      setMovementToDelete(null);
    } catch (error) {
      const message =
        error instanceof ConvexError
          ? (error.data as string)
          : "Failed to delete movement. Please try again.";

      setDeletionModalOpen(false);
      setMovementToDelete(null);
      setAlert({ type: "error", message });
    }

    setIsDeleting(false);
  }, [movementToDelete, deleteMovement]);

  const actions: TableRowActions = useMemo(
    () => ({
      e: handleEdit,
      d: handleDelete,
    }),
    [handleEdit, handleDelete],
  );

  return (
    <>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-white">Movements</h1>
          <p className="text-secondary-4">Move currency between your wallets</p>
        </div>

        <Button
          type="link"
          href="/movements/create"
          label="Add movement"
          icon={LuCirclePlus}
          iconPosition="left"
          tooltip={<Keymap text="n" />}
        />
      </div>

      {alert.message && (
        <div className="mb-4">
          <Alert type={alert.type} message={alert.message} />
        </div>
      )}

      {!movements ? (
        <Spinner message="Loading your movements" />
      ) : (
        <Table numberOfRows={movements.length}>
          <TableHead>
            <TableRow>
              <TableHeader>Date</TableHeader>
              <TableHeader>Source</TableHeader>
              <TableHeader>Value</TableHeader>
              <TableHeader>Target</TableHeader>
              <TableHeader>Actions</TableHeader>
            </TableRow>
          </TableHead>

          <TableBody>
            {movements.map((movement, index) => (
              <TableRow key={movement._id} rowIndex={index} actions={actions}>
                <TableCell>{movement.date}</TableCell>
                <TableCell>{movement.sourceWalletName}</TableCell>
                <TableCell>
                  <Currency value={movement.value} />
                </TableCell>
                <TableCell>{movement.targetWalletName}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      type="link"
                      icon={LuPencilLine}
                      iconPosition="left"
                      href={`/movements/${movement._id}/edit`}
                      size="sm"
                      variant="primary-ghost"
                      tooltip={
                        <>
                          Edit <Keymap text="e" className="ml-1" />
                        </>
                      }
                    />

                    <Button
                      type="button"
                      icon={LuTrash}
                      iconPosition="left"
                      onClick={() => handleDelete(index)}
                      size="sm"
                      variant="danger-ghost"
                      tooltip={
                        <>
                          Delete <Keymap text="d" className="ml-1" />
                        </>
                      }
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ConfirmationModal
        isOpen={deletionModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete movement"
        message={`Are you sure you want to delete the movement from ${movementToDelete?.source ?? ""} to ${movementToDelete?.target ?? ""}? This will reverse the wallet balance changes. This action cannot be undone.`}
        confirmText="Delete"
        variant="danger-ghost"
        loading={isDeleting}
      />
    </>
  );
}
