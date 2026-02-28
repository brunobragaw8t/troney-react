import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { useMemo } from "react";
import { LuArrowLeft } from "react-icons/lu";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { WalletForm } from "../../../components/wallets/wallet-form";
import { Button } from "../../../components/ui/button/button";
import { Spinner } from "../../../components/ui/spinner/spinner";
import { useKeyboardShortcuts } from "../../../hooks/use-keyboard-shortcuts";

export const Route = createFileRoute("/wallets/$walletId/edit")({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();
  const walletId = params.walletId as Id<"wallets">;
  const navigate = useNavigate();

  useKeyboardShortcuts({
    shortcuts: useMemo(
      () => [
        {
          key: "Escape",
          action: () => {
            navigate({ to: "/wallets" });
          },
        },
      ],
      [navigate],
    ),
  });

  function handleGoBack() {
    navigate({ to: "/wallets" });
  }

  const wallet = useQuery(api.wallets.getWallet, {
    id: walletId,
  });

  const updateWallet = useMutation(api.wallets.updateWallet);

  async function handleSubmit(data: { name: string }) {
    try {
      await updateWallet({
        id: walletId,
        name: data.name,
      });
      navigate({ to: "/wallets" });
    } catch (error) {
      const message =
        error instanceof ConvexError
          ? (error.data as string)
          : "Failed to update wallet. Please try again.";
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

        <h1 className="text-3xl font-bold text-white">Edit wallet</h1>
      </div>

      <p className="mb-8 text-secondary-4">Update your wallet details</p>

      {wallet === undefined ? (
        <Spinner message="Loading wallet" />
      ) : (
        <WalletForm
          initialName={wallet.name}
          initialBalance={wallet.balance}
          inputBalance={false}
          submitLabel="Save changes"
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
