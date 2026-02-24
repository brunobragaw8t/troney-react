import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { useMemo } from "react";
import { LuArrowLeft } from "react-icons/lu";
import { api } from "../../../convex/_generated/api";
import { BucketForm } from "../../components/buckets/bucket-form";
import { Button } from "../../components/ui/button/button";
import { useKeyboardShortcuts } from "../../hooks/use-keyboard-shortcuts";

export const Route = createFileRoute("/buckets/create")({
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
            navigate({ to: "/buckets" });
          },
        },
      ],
      [navigate],
    ),
  });

  function handleGoBack() {
    navigate({ to: "/buckets" });
  }

  const createBucket = useMutation(api.buckets.createBucket);

  async function handleSubmit(data: {
    name: string;
    budget: number;
    balance?: number;
  }) {
    try {
      await createBucket({
        name: data.name,
        budget: data.budget,
        balance: data.balance,
      });
      navigate({ to: "/buckets" });
    } catch (error) {
      const message =
        error instanceof ConvexError
          ? (error.data as string)
          : "Failed to create bucket. Please try again.";
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

        <h1 className="text-3xl font-bold text-white">Create bucket</h1>
      </div>

      <p className="mb-8 text-secondary-4">
        Add a new bucket to organize your budget
      </p>

      <BucketForm
        showBalance={true}
        submitLabel="Create bucket"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
