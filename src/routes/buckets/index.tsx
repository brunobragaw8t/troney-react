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

export const Route = createFileRoute("/buckets/")({
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
            navigate({ to: "/buckets/create" });
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

  const buckets = useQuery(api.buckets.getBuckets);

  const totalBudget = useMemo(
    () => (buckets ?? []).reduce((sum, b) => sum + b.budget, 0),
    [buckets],
  );
  const budgetIsNot100 = totalBudget !== 100;

  const totalBalance = useMemo(
    () => (buckets ?? []).reduce((sum, b) => sum + b.balance, 0),
    [buckets],
  );

  const handleEdit = useCallback(
    (index: number) => {
      if (!buckets) return;
      navigate({ to: `/buckets/${buckets[index]._id}/edit` });
    },
    [navigate, buckets],
  );

  const deleteBucket = useMutation(api.buckets.deleteBucket);
  const [deletionModalOpen, setDeletionModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [bucketToDelete, setBucketToDelete] = useState<{
    id: Id<"buckets">;
    name: string;
  } | null>(null);

  const handleDelete = useCallback(
    (index: number) => {
      if (!buckets) return;
      const bucket = buckets[index];
      setBucketToDelete({ id: bucket._id, name: bucket.name });
      setDeletionModalOpen(true);
    },
    [buckets],
  );

  const handleCancelDelete = useCallback(() => {
    setDeletionModalOpen(false);
    setBucketToDelete(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!bucketToDelete) return;

    setIsDeleting(true);
    setAlert({ type: "error", message: "" });

    try {
      await deleteBucket({ id: bucketToDelete.id });
      setDeletionModalOpen(false);
      setBucketToDelete(null);
    } catch (error) {
      const message =
        error instanceof ConvexError
          ? (error.data as string)
          : "Failed to delete bucket. Please try again.";

      setDeletionModalOpen(false);
      setBucketToDelete(null);
      setAlert({ type: "error", message });
    }

    setIsDeleting(false);
  }, [bucketToDelete, deleteBucket]);

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
          <h1 className="mb-2 text-3xl font-bold text-white">Buckets</h1>
          <p className="text-secondary-4">Manage your budget buckets</p>
        </div>

        <Button
          type="link"
          href="/buckets/create"
          label="Add bucket"
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

      {!buckets ? (
        <Spinner message="Loading your buckets" />
      ) : (
        <Table numberOfRows={buckets.length}>
          <TableHead>
            <TableRow>
              <TableHeader>Name</TableHeader>
              <TableHeader>Budget</TableHeader>
              <TableHeader>Balance</TableHeader>
              <TableHeader>Actions</TableHeader>
            </TableRow>
          </TableHead>

          <TableBody>
            <TableRow
              className={
                budgetIsNot100 ? "border-red-500 bg-red-500/10" : undefined
              }
            >
              <TableHeader>Total</TableHeader>
              <TableCell>{totalBudget}%</TableCell>
              <TableCell>
                <Currency value={totalBalance} />
              </TableCell>
              <TableCell />
            </TableRow>

            {buckets.map((bucket, index) => (
              <TableRow key={bucket._id} rowIndex={index} actions={actions}>
                <TableHeader>{bucket.name}</TableHeader>
                <TableCell>{bucket.budget}%</TableCell>
                <TableCell>
                  <Currency value={bucket.balance} />
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      type="link"
                      icon={LuPencilLine}
                      iconPosition="left"
                      href={`/buckets/${bucket._id}/edit`}
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
        title="Delete bucket"
        message="Are you sure you want to delete this bucket? This action cannot be undone."
        confirmText="Delete"
        variant="danger-ghost"
        loading={isDeleting}
      />
    </>
  );
}
