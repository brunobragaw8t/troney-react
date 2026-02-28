import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { useMemo } from "react";
import { LuArrowLeft } from "react-icons/lu";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { EarningForm } from "../../../components/earnings/earning-form";
import { Button } from "../../../components/ui/button/button";
import { Spinner } from "../../../components/ui/spinner/spinner";
import { useKeyboardShortcuts } from "../../../hooks/use-keyboard-shortcuts";

export const Route = createFileRoute("/earnings/$earningId/edit")({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();
  const earningId = params.earningId as Id<"earnings">;
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

  const earning = useQuery(api.earnings.getEarning, {
    id: earningId,
  });

  const updateEarning = useMutation(api.earnings.updateEarning);

  async function handleSubmit(data: {
    walletId: string;
    title: string;
    description: string;
    value: number;
    source: string;
    date: string;
  }) {
    try {
      await updateEarning({
        id: earningId,
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
          : "Failed to update earning. Please try again.";
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

        <h1 className="text-3xl font-bold text-white">Edit earning</h1>
      </div>

      <p className="mb-8 text-secondary-4">Update your earning details</p>

      {earning === undefined ? (
        <Spinner message="Loading earning" />
      ) : (
        <EarningForm
          initialWalletId={earning.walletId}
          initialTitle={earning.title}
          initialDescription={earning.description}
          initialValue={earning.value}
          initialSource={earning.source}
          initialDate={earning.date}
          submitLabel="Save changes"
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
