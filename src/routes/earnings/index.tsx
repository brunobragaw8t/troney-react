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

export const Route = createFileRoute("/earnings/")({
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
            navigate({ to: "/earnings/create" });
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

  const earnings = useQuery(api.earnings.getEarnings);

  const handleEdit = useCallback(
    (index: number) => {
      if (!earnings) return;
      navigate({ to: `/earnings/${earnings[index]._id}/edit` });
    },
    [navigate, earnings],
  );

  const deleteEarning = useMutation(api.earnings.deleteEarning);
  const [deletionModalOpen, setDeletionModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [earningToDelete, setEarningToDelete] = useState<{
    id: Id<"earnings">;
    title: string;
  } | null>(null);

  const handleDelete = useCallback(
    (index: number) => {
      if (!earnings) return;
      const earning = earnings[index];
      setEarningToDelete({ id: earning._id, title: earning.title });
      setDeletionModalOpen(true);
    },
    [earnings],
  );

  const handleCancelDelete = useCallback(() => {
    setDeletionModalOpen(false);
    setEarningToDelete(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!earningToDelete) return;

    setIsDeleting(true);
    setAlert({ type: "error", message: "" });

    try {
      await deleteEarning({ id: earningToDelete.id });
      setDeletionModalOpen(false);
      setEarningToDelete(null);
    } catch (error) {
      const message =
        error instanceof ConvexError
          ? (error.data as string)
          : "Failed to delete earning. Please try again.";

      setDeletionModalOpen(false);
      setEarningToDelete(null);
      setAlert({ type: "error", message });
    }

    setIsDeleting(false);
  }, [earningToDelete, deleteEarning]);

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
          <h1 className="mb-2 text-3xl font-bold text-white">Earnings</h1>
          <p className="text-secondary-4">Manage your income</p>
        </div>

        <Button
          type="link"
          href="/earnings/create"
          label="Add earning"
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

      {!earnings ? (
        <Spinner message="Loading your earnings" />
      ) : (
        <Table numberOfRows={earnings.length}>
          <TableHead>
            <TableRow>
              <TableHeader>Title</TableHeader>
              <TableHeader>Value</TableHeader>
              <TableHeader>Source</TableHeader>
              <TableHeader>Wallet</TableHeader>
              <TableHeader>Date</TableHeader>
              <TableHeader>Actions</TableHeader>
            </TableRow>
          </TableHead>

          <TableBody>
            {earnings.map((earning, index) => (
              <TableRow key={earning._id} rowIndex={index} actions={actions}>
                <TableCell>{earning.title}</TableCell>
                <TableCell>
                  <Currency value={earning.value} />
                </TableCell>
                <TableCell>{earning.source}</TableCell>
                <TableCell>{earning.walletName}</TableCell>
                <TableCell>{earning.date}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      type="link"
                      icon={LuPencilLine}
                      iconPosition="left"
                      href={`/earnings/${earning._id}/edit`}
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
        title="Delete earning"
        message="Are you sure you want to delete this earning? This will reverse the wallet and bucket balance changes. This action cannot be undone."
        confirmText="Delete"
        variant="danger-ghost"
        loading={isDeleting}
      />
    </>
  );
}
