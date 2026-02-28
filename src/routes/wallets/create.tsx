import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { useMemo } from "react";
import { LuArrowLeft } from "react-icons/lu";
import { api } from "../../../convex/_generated/api";
import { WalletForm } from "../../components/wallets/wallet-form";
import { Button } from "../../components/ui/button/button";
import { useKeyboardShortcuts } from "../../hooks/use-keyboard-shortcuts";

export const Route = createFileRoute("/wallets/create")({
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

  const createWallet = useMutation(api.wallets.createWallet);

  async function handleSubmit(data: { name: string; balance?: number }) {
    try {
      await createWallet({
        name: data.name,
        balance: data.balance,
      });
      navigate({ to: "/wallets" });
    } catch (error) {
      const message =
        error instanceof ConvexError
          ? (error.data as string)
          : "Failed to create wallet. Please try again.";
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

        <h1 className="text-3xl font-bold text-white">Create wallet</h1>
      </div>

      <p className="mb-8 text-secondary-4">
        Add a new wallet to store your money
      </p>

      <WalletForm submitLabel="Create wallet" onSubmit={handleSubmit} />
    </div>
  );
}
