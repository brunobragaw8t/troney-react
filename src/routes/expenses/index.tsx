import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { useCallback, useMemo, useState } from "react";
import { LuCirclePlus, LuLayers, LuPencilLine, LuTrash } from "react-icons/lu";
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

interface MergedRow {
  _id: string;
  type: "expense" | "expense_group";
  title: string;
  value: number;
  source: string;
  categoryName: string;
  bucketName: string;
  walletName: string;
  date: string;
}

function RouteComponent() {
  const navigate = useNavigate();

  const {
    results: expenses,
    status,
    loadMore,
  } = usePaginatedQuery(api.expenses.getExpenses, {}, { initialNumItems: 50 });

  const groups = useQuery(api.expense_groups.getAllExpenseGroups);

  const merged = useMemo(() => {
    const expenseRows: MergedRow[] = expenses.map((e) => ({
      _id: e._id,
      type: "expense" as const,
      title: e.title,
      value: e.value,
      source: e.source,
      categoryName: e.categoryName,
      bucketName: e.bucketName,
      walletName: e.walletName,
      date: e.date,
    }));

    const groupRows: MergedRow[] = (groups ?? []).map((g) => ({
      _id: g._id,
      type: "expense_group" as const,
      title: g.title,
      value: g.value,
      source: g.source,
      categoryName: g.categoryName,
      bucketName: g.bucketName,
      walletName: g.walletName,
      date: g.date,
    }));

    return [...expenseRows, ...groupRows].sort((a, b) =>
      b.date.localeCompare(a.date),
    );
  }, [expenses, groups]);

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
          key: "N",
          shift: true,
          action: () => {
            navigate({ to: "/expense-groups/create" });
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
      const item = merged[index];
      if (item.type === "expense") {
        navigate({ to: `/expenses/${item._id}/edit` });
      } else {
        navigate({ to: `/expense-groups/${item._id}/edit` });
      }
    },
    [navigate, merged],
  );

  const deleteExpense = useMutation(api.expenses.deleteExpense);
  const deleteExpenseGroup = useMutation(api.expense_groups.deleteExpenseGroup);
  const [deletionModalOpen, setDeletionModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    type: "expense" | "expense_group";
    title: string;
  } | null>(null);

  const handleDelete = useCallback(
    (index: number) => {
      const item = merged[index];
      setItemToDelete({
        id: item._id,
        type: item.type,
        title: item.title,
      });
      setDeletionModalOpen(true);
    },
    [merged],
  );

  const handleCancelDelete = useCallback(() => {
    setDeletionModalOpen(false);
    setItemToDelete(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    setAlert({ type: "error", message: "" });

    try {
      if (itemToDelete.type === "expense") {
        await deleteExpense({ id: itemToDelete.id as Id<"expenses"> });
      } else {
        await deleteExpenseGroup({
          id: itemToDelete.id as Id<"expenseGroups">,
        });
      }
      setDeletionModalOpen(false);
      setItemToDelete(null);
    } catch (error) {
      const message =
        error instanceof ConvexError
          ? (error.data as string)
          : "Failed to delete. Please try again.";

      setDeletionModalOpen(false);
      setItemToDelete(null);
      setAlert({ type: "error", message });
    }

    setIsDeleting(false);
  }, [itemToDelete, deleteExpense, deleteExpenseGroup]);

  const actions: TableRowActions = useMemo(
    () => ({
      e: handleEdit,
      d: handleDelete,
    }),
    [handleEdit, handleDelete],
  );

  const isLoading = status === "LoadingFirstPage" || groups === undefined;

  return (
    <>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-white">Expenses</h1>
          <p className="text-secondary-4">Manage your expenses</p>
        </div>

        <div className="flex gap-2">
          <Button
            type="link"
            href="/expenses/create"
            label="Add expense"
            icon={LuCirclePlus}
            iconPosition="left"
            tooltip={<Keymap text="n" />}
          />

          <Button
            type="link"
            href="/expense-groups/create"
            label="Add group"
            icon={LuLayers}
            iconPosition="left"
            tooltip={
              <>
                <Keymap text="Shift" />+<Keymap text="n" />
              </>
            }
          />
        </div>
      </div>

      {alert.message && (
        <div className="mb-4">
          <Alert type={alert.type} message={alert.message} />
        </div>
      )}

      {isLoading ? (
        <Spinner message="Loading your expenses" />
      ) : (
        <>
          <Table numberOfRows={merged.length} onLoadMore={handleLoadMore}>
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
              {merged.map((item, index) => (
                <TableRow
                  key={`${item.type}-${item._id}`}
                  rowIndex={index}
                  actions={actions}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {item.type === "expense_group" && (
                        <LuLayers size={14} className="text-secondary-4" />
                      )}
                      {item.title}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Currency value={item.value} />
                  </TableCell>
                  <TableCell>{item.source}</TableCell>
                  <TableCell>{item.categoryName}</TableCell>
                  <TableCell>{item.bucketName}</TableCell>
                  <TableCell>{item.walletName}</TableCell>
                  <TableCell>{item.date}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        type="link"
                        icon={LuPencilLine}
                        iconPosition="left"
                        href={
                          item.type === "expense"
                            ? `/expenses/${item._id}/edit`
                            : `/expense-groups/${item._id}/edit`
                        }
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
        message="Are you sure you want to delete this? This will reverse the wallet and bucket balance changes. This action cannot be undone."
        confirmText="Delete"
        variant="danger-ghost"
        loading={isDeleting}
      />
    </>
  );
}
