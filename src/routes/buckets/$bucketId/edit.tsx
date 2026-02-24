import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { useMemo } from "react";
import { LuArrowLeft } from "react-icons/lu";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { BucketForm } from "../../../components/buckets/bucket-form";
import { Button } from "../../../components/ui/button/button";
import { Spinner } from "../../../components/ui/spinner/spinner";
import { useKeyboardShortcuts } from "../../../hooks/use-keyboard-shortcuts";

export const Route = createFileRoute("/buckets/$bucketId/edit")({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();
  const bucketId = params.bucketId as Id<"buckets">;
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

  const bucket = useQuery(api.buckets.getBucket, {
    id: bucketId,
  });

  const updateBucket = useMutation(api.buckets.updateBucket);

  async function handleSubmit(data: { name: string; budget: number }) {
    try {
      await updateBucket({
        id: bucketId,
        name: data.name,
        budget: data.budget,
      });
      navigate({ to: "/buckets" });
    } catch (error) {
      const message =
        error instanceof ConvexError
          ? (error.data as string)
          : "Failed to update bucket. Please try again.";
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

        <h1 className="text-3xl font-bold text-white">Edit bucket</h1>
      </div>

      <p className="mb-8 text-secondary-4">Update the details of your bucket</p>

      {bucket === undefined ? (
        <Spinner message="Loading bucket" />
      ) : (
        <BucketForm
          initialName={bucket.name}
          initialBudget={bucket.budget}
          showBalance={false}
          submitLabel="Save changes"
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
