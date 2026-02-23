import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { useMemo } from "react";
import { LuArrowLeft } from "react-icons/lu";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { CategoryForm } from "../../../components/categories/category-form";
import { Button } from "../../../components/ui/button/button";
import { Spinner } from "../../../components/ui/spinner/spinner";
import { useKeyboardShortcuts } from "../../../hooks/use-keyboard-shortcuts";

export const Route = createFileRoute("/categories/$categoryId/edit")({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();
  const categoryId = params.categoryId as Id<"categories">;
  const navigate = useNavigate();

  useKeyboardShortcuts({
    shortcuts: useMemo(
      () => [
        {
          key: "Escape",
          action: () => {
            navigate({ to: "/categories" });
          },
        },
      ],
      [navigate],
    ),
  });

  function handleGoBack() {
    navigate({ to: "/categories" });
  }

  const category = useQuery(api.categories.getCategory, {
    id: categoryId as Id<"categories">,
  });

  const updateCategory = useMutation(api.categories.updateCategory);

  async function handleSubmit(data: {
    name: string;
    color: string;
    icon: string;
  }) {
    try {
      await updateCategory({
        id: categoryId as Id<"categories">,
        name: data.name,
        color: data.color,
        icon: data.icon,
      });
      navigate({ to: "/categories" });
    } catch (error) {
      const message =
        error instanceof ConvexError
          ? (error.data as string)
          : "Failed to update category. Please try again.";
      throw new Error(message);
    }
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-3">
        <Button
          type="button"
          icon={LuArrowLeft}
          iconPosition="left"
          variant="outline"
          size="sm"
          onClick={handleGoBack}
        />

        <h1 className="text-3xl font-bold text-white">Edit category</h1>
      </div>

      <p className="mb-8 text-secondary-4">
        Update the details of your category
      </p>

      {category === undefined ? (
        <Spinner message="Loading category" />
      ) : (
        <CategoryForm
          initialName={category.name}
          initialColor={category.color}
          initialIcon={category.icon ?? ""}
          submitLabel="Save changes"
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
