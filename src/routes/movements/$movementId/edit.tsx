import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { useMemo } from "react";
import { LuArrowLeft } from "react-icons/lu";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { MovementForm } from "../../../components/movements/movement-form";
import { Button } from "../../../components/ui/button/button";
import { Spinner } from "../../../components/ui/spinner/spinner";
import { useKeyboardShortcuts } from "../../../hooks/use-keyboard-shortcuts";

export const Route = createFileRoute("/movements/$movementId/edit")({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();
  const movementId = params.movementId as Id<"movements">;
  const navigate = useNavigate();

  useKeyboardShortcuts({
    shortcuts: useMemo(
      () => [
        {
          key: "Escape",
          action: () => {
            navigate({ to: "/movements" });
          },
        },
      ],
      [navigate],
    ),
  });

  function handleGoBack() {
    navigate({ to: "/movements" });
  }

  const movement = useQuery(api.movements.getMovement, {
    id: movementId,
  });

  const updateMovement = useMutation(api.movements.updateMovement);

  async function handleSubmit(data: {
    walletIdSource: string;
    walletIdTarget: string;
    value: number;
    date: string;
  }) {
    try {
      await updateMovement({
        id: movementId,
        walletIdSource: data.walletIdSource
          ? (data.walletIdSource as Id<"wallets">)
          : undefined,
        walletIdTarget: data.walletIdTarget
          ? (data.walletIdTarget as Id<"wallets">)
          : undefined,
        value: data.value,
        date: data.date,
      });
      navigate({ to: "/movements" });
    } catch (error) {
      const message =
        error instanceof ConvexError
          ? (error.data as string)
          : "Failed to update movement. Please try again.";
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

        <h1 className="text-3xl font-bold text-white">Edit movement</h1>
      </div>

      <p className="mb-8 text-secondary-4">Update your movement details</p>

      {movement === undefined ? (
        <Spinner message="Loading movement" />
      ) : (
        <MovementForm
          initialWalletIdSource={movement.walletIdSource ?? ""}
          initialWalletIdTarget={movement.walletIdTarget ?? ""}
          initialValue={movement.value}
          initialDate={movement.date}
          submitLabel="Save changes"
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
