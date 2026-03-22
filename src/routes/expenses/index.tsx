import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, usePaginatedQuery } from "convex/react";
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

export const Route = createFileRoute("/expenses/")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();

  const { results, status, loadMore } = usePaginatedQuery(
    api.expenses.getExpenses,
    {},
    { initialNumItems: 50 },
  );

  const handleLoadMore = useCallback(() => {
    if (status === "CanLoadMore") {
      loadMore(10);
    }
  }, [status, loadMore]);

  useKeyboardShortcuts({
    shortcuts: useMemo(
      () => [
        {
          key: "n",
          action: () => {
            navigate({ to: "/expenses/create" });
          },
        },
        {
          key: "l",
          action: handleLoadMore,
        },
      ],
      [navigate, handleLoadMore],
    ),
  });

  const [alert, setAlert] = useState<AlertProps>({
    type: "error",
    message: "",
  });

  const handleEdit = useCallback(
    (index: number) => {
      navigate({ to: `/expenses/${results[index]._id}/edit` });
    },
    [navigate, results],
  );

  const deleteExpense = useMutation(api.expenses.deleteExpense);
  const [deletionModalOpen, setDeletionModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<{
    id: Id<"expenses">;
    title: string;
  } | null>(null);

  const handleDelete = useCallback(
    (index: number) => {
      const expense = results[index];
      setExpenseToDelete({ id: expense._id, title: expense.title });
      setDeletionModalOpen(true);
    },
    [results],
  );

  const handleCancelDelete = useCallback(() => {
    setDeletionModalOpen(false);
    setExpenseToDelete(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!expenseToDelete) return;

    setIsDeleting(true);
    setAlert({ type: "error", message: "" });

    try {
      await deleteExpense({ id: expenseToDelete.id });
      setDeletionModalOpen(false);
      setExpenseToDelete(null);
    } catch (error) {
      const message =
        error instanceof ConvexError
          ? (error.data as string)
          : "Failed to delete expense. Please try again.";

      setDeletionModalOpen(false);
      setExpenseToDelete(null);
      setAlert({ type: "error", message });
    }

    setIsDeleting(false);
  }, [expenseToDelete, deleteExpense]);

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
          <h1 className="mb-2 text-3xl font-bold text-white">Expenses</h1>
          <p className="text-secondary-4">Manage your expenses</p>
        </div>

        <Button
          type="link"
          href="/expenses/create"
          label="Add expense"
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

      {status === "LoadingFirstPage" ? (
        <Spinner message="Loading your expenses" />
      ) : (
        <>
          <Table numberOfRows={results.length} onLoadMore={handleLoadMore}>
            <TableHead>
              <TableRow>
                <TableHeader>Title</TableHeader>
                <TableHeader>Value</TableHeader>
                <TableHeader>Source</TableHeader>
                <TableHeader>Category</TableHeader>
                <TableHeader>Bucket</TableHeader>
                <TableHeader>Wallet</TableHeader>
                <TableHeader>Date</TableHeader>
                <TableHeader>Actions</TableHeader>
              </TableRow>
            </TableHead>

            <TableBody>
              {results.map((expense, index) => (
                <TableRow key={expense._id} rowIndex={index} actions={actions}>
                  <TableCell>{expense.title}</TableCell>
                  <TableCell>
                    <Currency value={expense.value} />
                  </TableCell>
                  <TableCell>{expense.source}</TableCell>
                  <TableCell>{expense.categoryName}</TableCell>
                  <TableCell>{expense.bucketName}</TableCell>
                  <TableCell>{expense.walletName}</TableCell>
                  <TableCell>{expense.date}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        type="link"
                        icon={LuPencilLine}
                        iconPosition="left"
                        href={`/expenses/${expense._id}/edit`}
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

          {status === "LoadingMore" && (
            <div className="mt-4 flex justify-center">
              <Spinner message="Loading more expenses" />
            </div>
          )}

          {status === "CanLoadMore" && (
            <div className="mt-4 flex justify-center">
              <Button
                type="button"
                label="Load more"
                onClick={handleLoadMore}
                tooltip={<Keymap text="l" />}
              />
            </div>
          )}
        </>
      )}

      <ConfirmationModal
        isOpen={deletionModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete expense"
        message="Are you sure you want to delete this expense? This will reverse the wallet and bucket balance changes. This action cannot be undone."
        confirmText="Delete"
        variant="danger-ghost"
        loading={isDeleting}
      />
    </>
  );
}
