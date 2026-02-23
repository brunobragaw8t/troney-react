import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { useMemo } from "react";
import { LuArrowLeft } from "react-icons/lu";
import { api } from "../../../convex/_generated/api";
import { CategoryForm } from "../../components/categories/category-form";
import { Button } from "../../components/ui/button/button";
import { useKeyboardShortcuts } from "../../hooks/use-keyboard-shortcuts";

export const Route = createFileRoute("/categories/create")({
  component: RouteComponent,
});

function RouteComponent() {
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

  const createCategory = useMutation(api.categories.createCategory);

  async function handleSubmit(data: {
    name: string;
    color: string;
    icon: string;
  }) {
    try {
      await createCategory({
        name: data.name,
        color: data.color,
        icon: data.icon,
      });
      navigate({ to: "/categories" });
    } catch (error) {
      const message =
        error instanceof ConvexError
          ? (error.data as string)
          : "Failed to create category. Please try again.";
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

        <h1 className="text-3xl font-bold text-white">Create category</h1>
      </div>

      <p className="mb-8 text-secondary-4">
        Add a new category to organize your expenses
      </p>

      <CategoryForm submitLabel="Create category" onSubmit={handleSubmit} />
    </div>
  );
}
