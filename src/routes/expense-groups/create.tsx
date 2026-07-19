import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { useMemo } from "react";
import { LuArrowLeft } from "react-icons/lu";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  ExpenseGroupForm,
  type ExpenseGroupFormData,
} from "../../components/expense-groups/expense-group-form";
import { Button } from "../../components/ui/button/button";
import { useKeyboardShortcuts } from "../../hooks/use-keyboard-shortcuts";

export const Route = createFileRoute("/expense-groups/create")({
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
            navigate({ to: "/expenses" });
          },
        },
      ],
      [navigate],
    ),
  });

  function handleGoBack() {
    navigate({ to: "/expenses" });
  }

  const createExpenseGroup = useMutation(api.expense_groups.createExpenseGroup);

  async function handleSubmit(data: ExpenseGroupFormData) {
    try {
      await createExpenseGroup({
        walletId: data.walletId as Id<"wallets">,
        date: data.date,
        source: data.source,
        description: data.description || undefined,
        items: data.items.map((item) => ({
          bucketId: item.bucketId as Id<"buckets">,
          categoryId: item.categoryId as Id<"categories">,
          title: item.title,
          value: item.value,
          description: item.description || undefined,
        })),
      });
      navigate({ to: "/expenses" });
    } catch (error) {
      const message =
        error instanceof ConvexError
          ? (error.data as string)
          : "Failed to create expense group. Please try again.";
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

        <h1 className="text-3xl font-bold text-white">
          Create expense group
        </h1>
      </div>

      <p className="mb-8 text-secondary-4">
        Group related expenses from a single shopping trip
      </p>

      <ExpenseGroupForm
        submitLabel="Create expense group"
        onSubmit={handleSubmit}
        initialDate={new Date().toISOString().split("T")[0]}
      />
    </div>
  );
}
