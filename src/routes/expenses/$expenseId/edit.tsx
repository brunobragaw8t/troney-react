import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { useMemo } from "react";
import { LuArrowLeft } from "react-icons/lu";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { ExpenseForm } from "../../../components/expenses/expense-form";
import { Button } from "../../../components/ui/button/button";
import { Spinner } from "../../../components/ui/spinner/spinner";
import { useKeyboardShortcuts } from "../../../hooks/use-keyboard-shortcuts";

export const Route = createFileRoute("/expenses/$expenseId/edit")({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();
  const expenseId = params.expenseId as Id<"expenses">;
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

  const expense = useQuery(api.expenses.getExpense, {
    id: expenseId,
  });

  const updateExpense = useMutation(api.expenses.updateExpense);

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
      await updateExpense({
        id: expenseId,
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
          : "Failed to update expense. Please try again.";
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

        <h1 className="text-3xl font-bold text-white">Edit expense</h1>
      </div>

      <p className="mb-8 text-secondary-4">Update your expense details</p>

      {expense === undefined ? (
        <Spinner message="Loading expense" />
      ) : (
        <ExpenseForm
          initialWalletId={expense.walletId}
          initialBucketId={expense.bucketId}
          initialCategoryId={expense.categoryId}
          initialTitle={expense.title}
          initialDescription={expense.description}
          initialValue={expense.value}
          initialSource={expense.source}
          initialDate={expense.date}
          submitLabel="Save changes"
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
