import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { useMemo } from "react";
import { LuArrowLeft } from "react-icons/lu";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { EarningForm } from "../../components/earnings/earning-form";
import { Button } from "../../components/ui/button/button";
import { useKeyboardShortcuts } from "../../hooks/use-keyboard-shortcuts";

export const Route = createFileRoute("/earnings/create")({
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
            navigate({ to: "/earnings" });
          },
        },
      ],
      [navigate],
    ),
  });

  function handleGoBack() {
    navigate({ to: "/earnings" });
  }

  const createEarning = useMutation(api.earnings.createEarning);

  async function handleSubmit(data: {
    walletId: string;
    title: string;
    description: string;
    value: number;
    source: string;
    date: string;
  }) {
    try {
      await createEarning({
        walletId: data.walletId as Id<"wallets">,
        title: data.title,
        description: data.description,
        value: data.value,
        source: data.source,
        date: data.date,
      });
      navigate({ to: "/earnings" });
    } catch (error) {
      const message =
        error instanceof ConvexError
          ? (error.data as string)
          : "Failed to create earning. Please try again.";
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

        <h1 className="text-3xl font-bold text-white">Create earning</h1>
      </div>

      <p className="mb-8 text-secondary-4">
        Add money to your wallet and buckets
      </p>

      <EarningForm
        submitLabel="Create earning"
        onSubmit={handleSubmit}
        initialDate={new Date().toISOString().split("T")[0]}
      />
    </div>
  );
}
