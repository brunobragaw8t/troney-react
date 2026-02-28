import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { useMemo } from "react";
import { LuArrowLeft } from "react-icons/lu";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { ExpenseForm } from "../../components/expenses/expense-form";
import { Button } from "../../components/ui/button/button";
import { useKeyboardShortcuts } from "../../hooks/use-keyboard-shortcuts";

export const Route = createFileRoute("/expenses/create")({
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

  const createExpense = useMutation(api.expenses.createExpense);

  async function handleSubmit(data: {
    walletId: string;
    bucketId: string;
    categoryId: string;
    title: string;
    description: string;
    value: number;
    source: string;
    date: string;
  }) {
    try {
      await createExpense({
        walletId: data.walletId as Id<"wallets">,
        bucketId: data.bucketId as Id<"buckets">,
        categoryId: data.categoryId as Id<"categories">,
        title: data.title,
        description: data.description,
        value: data.value,
        source: data.source,
        date: data.date,
      });
      navigate({ to: "/expenses" });
    } catch (error) {
      const message =
        error instanceof ConvexError
          ? (error.data as string)
          : "Failed to create expense. Please try again.";
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

        <h1 className="text-3xl font-bold text-white">Create expense</h1>
      </div>

      <p className="mb-8 text-secondary-4">
        Track your expenses and categorize them
      </p>

      <ExpenseForm
        submitLabel="Create expense"
        onSubmit={handleSubmit}
        initialDate={new Date().toISOString().split("T")[0]}
      />
    </div>
  );
}
