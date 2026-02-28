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

export const Route = createFileRoute("/wallets/")({
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
            navigate({ to: "/wallets/create" });
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

  const wallets = useQuery(api.wallets.getWallets);

  const totalBalance = useMemo(
    () => (wallets ?? []).reduce((sum, w) => sum + w.balance, 0),
    [wallets],
  );

  const handleEdit = useCallback(
    (index: number) => {
      if (!wallets) return;
      navigate({ to: `/wallets/${wallets[index]._id}/edit` });
    },
    [navigate, wallets],
  );

  const deleteWallet = useMutation(api.wallets.deleteWallet);
  const [deletionModalOpen, setDeletionModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [walletToDelete, setWalletToDelete] = useState<{
    id: Id<"wallets">;
    name: string;
  } | null>(null);

  const handleDelete = useCallback(
    (index: number) => {
      if (!wallets) return;
      const wallet = wallets[index];
      setWalletToDelete({ id: wallet._id, name: wallet.name });
      setDeletionModalOpen(true);
    },
    [wallets],
  );

  const handleCancelDelete = useCallback(() => {
    setDeletionModalOpen(false);
    setWalletToDelete(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!walletToDelete) return;

    setIsDeleting(true);
    setAlert({ type: "error", message: "" });

    try {
      await deleteWallet({ id: walletToDelete.id });
      setDeletionModalOpen(false);
      setWalletToDelete(null);
    } catch (error) {
      const message =
        error instanceof ConvexError
          ? (error.data as string)
          : "Failed to delete wallet. Please try again.";

      setDeletionModalOpen(false);
      setWalletToDelete(null);
      setAlert({ type: "error", message });
    }

    setIsDeleting(false);
  }, [walletToDelete, deleteWallet]);

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
          <h1 className="mb-2 text-3xl font-bold text-white">Wallets</h1>
          <p className="text-secondary-4">Manage where your money goes</p>
        </div>

        <Button
          type="link"
          href="/wallets/create"
          label="Add wallet"
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

      {!wallets ? (
        <Spinner message="Loading your wallets" />
      ) : (
        <Table numberOfRows={wallets.length}>
          <TableHead>
            <TableRow>
              <TableHeader>Name</TableHeader>
              <TableHeader>Balance</TableHeader>
              <TableHeader>Actions</TableHeader>
            </TableRow>
          </TableHead>

          <TableBody>
            <TableRow>
              <TableHeader>Total</TableHeader>
              <TableCell>
                <Currency value={totalBalance} />
              </TableCell>
              <TableCell />
            </TableRow>

            {wallets.map((wallet, index) => (
              <TableRow key={wallet._id} rowIndex={index} actions={actions}>
                <TableHeader>{wallet.name}</TableHeader>
                <TableCell>
                  <Currency value={wallet.balance} />
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      type="link"
                      icon={LuPencilLine}
                      iconPosition="left"
                      href={`/wallets/${wallet._id}/edit`}
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
        title="Delete wallet"
        message="Are you sure you want to delete this wallet? This action cannot be undone."
        confirmText="Delete"
        variant="danger-ghost"
        loading={isDeleting}
      />
    </>
  );
}
