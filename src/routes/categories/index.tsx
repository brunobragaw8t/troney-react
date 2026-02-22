import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useCallback, useMemo, useState } from "react";
import { LuCirclePlus, LuPencilLine, LuTrash } from "react-icons/lu";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "../../components/ui/button/button";
import { ConfirmationModal } from "../../components/ui/confirmation-modal/confirmation-modal";
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

export const Route = createFileRoute("/categories/")({
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
            navigate({ to: "/categories/create" });
          },
        },
      ],
      [navigate],
    ),
  });

  const categories = useQuery(api.categories.getCategories);

  const handleEdit = useCallback(
    (index: number) => {
      if (!categories) return;
      navigate({ to: `/categories/${categories[index]._id}/edit` });
    },
    [navigate, categories],
  );

  const deleteCategory = useMutation(api.categories.deleteCategory);
  const [deletionModalOpen, setDeletionModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{
    id: Id<"categories">;
    name: string;
  } | null>(null);

  const handleDelete = useCallback(
    (index: number) => {
      if (!categories) return;
      const category = categories[index];
      setCategoryToDelete({ id: category._id, name: category.name });
      setDeletionModalOpen(true);
    },
    [categories],
  );

  const handleCancelDelete = useCallback(() => {
    setDeletionModalOpen(false);
    setCategoryToDelete(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!categoryToDelete) return;

    setIsDeleting(true);

    try {
      await deleteCategory({ id: categoryToDelete.id });
      setDeletionModalOpen(false);
      setCategoryToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  }, [categoryToDelete, deleteCategory]);

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
          <h1 className="mb-2 text-3xl font-bold text-white">Categories</h1>
          <p className="text-secondary-4">Organize your expenses</p>
        </div>

        <Button
          type="link"
          href="/categories/create"
          label="Add category"
          icon={LuCirclePlus}
          iconPosition="left"
          tooltip={<Keymap text="n" />}
        />
      </div>

      {!categories ? (
        <Spinner message="Loading your categories" />
      ) : (
        <Table numberOfRows={categories.length}>
          <TableHead>
            <TableRow>
              <TableHeader>Color</TableHeader>
              <TableHeader>Icon</TableHeader>
              <TableHeader>Name</TableHeader>
              <TableHeader>Actions</TableHeader>
            </TableRow>
          </TableHead>

          <TableBody>
            {categories.map((category, index) => (
              <TableRow key={category._id} rowIndex={index} actions={actions}>
                <TableCell>
                  <div
                    className="h-6 w-6 rounded-full border border-gray-600"
                    style={{ backgroundColor: category.color }}
                  />
                </TableCell>
                <TableCell>{category.icon || "—"}</TableCell>
                <TableHeader>{category.name}</TableHeader>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      type="link"
                      icon={LuPencilLine}
                      iconPosition="left"
                      href={`/categories/${category._id}/edit`}
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
        title="Delete category"
        message="Are you sure you want to delete this category? This action cannot be undone."
        confirmText="Delete"
        variant="danger-ghost"
        loading={isDeleting}
      />
    </>
  );
}
