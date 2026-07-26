import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useState } from "react";
import {
  LuCalendar,
  LuCaptions,
  LuCreditCard,
  LuFileText,
  LuFolder,
  LuPackageOpen,
  LuPlus,
  LuTrash,
  LuWallet,
} from "react-icons/lu";
import { api } from "../../../convex/_generated/api";
import { Alert, type AlertProps } from "../ui/alert/alert";
import { Button } from "../ui/button/button";
import { Currency } from "../ui/currency/currency";
import { Input } from "../ui/input/input";
import { Select } from "../ui/select/select";
import { Spinner } from "../ui/spinner/spinner";

export interface ExpenseGroupItemData {
  bucketId: string;
  categoryId: string;
  title: string;
  value: number;
  description: string;
}

interface ExpenseGroupItemFormState {
  bucketId: string;
  categoryId: string;
  title: string;
  value: string;
  description: string;
}

export interface ExpenseGroupFormData {
  walletId: string;
  date: string;
  source: string;
  description: string;
  items: ExpenseGroupItemData[];
}

interface ExpenseGroupFormProps {
  initialWalletId?: string;
  initialDate?: string;
  initialSource?: string;
  initialDescription?: string;
  initialItems?: ExpenseGroupItemData[];
  submitLabel: string;
  onSubmit: (data: ExpenseGroupFormData) => Promise<void>;
}

function createEmptyItem(): ExpenseGroupItemFormState {
  return {
    bucketId: "",
    categoryId: "",
    title: "",
    value: "",
    description: "",
  };
}

export function ExpenseGroupForm({
  initialWalletId = "",
  initialDate = "",
  initialSource = "",
  initialDescription = "",
  initialItems,
  submitLabel,
  onSubmit,
}: ExpenseGroupFormProps) {
  const [walletId, setWalletId] = useState(initialWalletId);

  function handleWalletIdChange(event: React.ChangeEvent<HTMLSelectElement>) {
    setWalletId(event.target.value);
  }

  const [date, setDate] = useState(initialDate);

  function handleDateChange(event: React.ChangeEvent<HTMLInputElement>) {
    setDate(event.target.value);
  }

  const [source, setSource] = useState(initialSource);

  function handleSourceChange(event: React.ChangeEvent<HTMLInputElement>) {
    setSource(event.target.value);
  }

  const [description, setDescription] = useState(initialDescription);

  function handleDescriptionChange(event: React.ChangeEvent<HTMLInputElement>) {
    setDescription(event.target.value);
  }

  const [items, setItems] = useState<ExpenseGroupItemFormState[]>(
    initialItems?.map((item) => ({
      ...item,
      value: item.value ? String(item.value / 100) : "",
    })) ?? [createEmptyItem()],
  );

  function handleItemChange(
    index: number,
    field: keyof ExpenseGroupItemFormState,
    value: string,
  ) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  }

  const [focusIndex, setFocusIndex] = useState<number | null>(null);

  function handleAddItem() {
    setItems((prev) => {
      setFocusIndex(prev.length);
      return [...prev, createEmptyItem()];
    });
  }

  function handleRemoveItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  const totalValue = items.reduce(
    (sum, item) => sum + (parseFloat(item.value) || 0),
    0,
  );

  const [alert, setAlert] = useState<AlertProps>({
    type: "success",
    message: "",
  });

  const navigate = useNavigate();

  function handleCancel() {
    navigate({ to: "/expenses" });
  }

  const [loading, setLoading] = useState(false);

  const wallets = useQuery(api.wallets.getWallets);
  const buckets = useQuery(api.buckets.getBuckets);
  const categories = useQuery(api.categories.getCategories);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setAlert({ type: "success", message: "" });

    if (items.length === 0) {
      setAlert({ type: "error", message: "At least one item is required" });
      setLoading(false);
      return;
    }

    const processedItems: {
      bucketId: string;
      categoryId: string;
      title: string;
      value: number;
      description: string;
    }[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.title.trim()) {
        setAlert({
          type: "error",
          message: `Item ${i + 1}: title is required`,
        });
        setLoading(false);
        return;
      }
      if (!item.bucketId) {
        setAlert({
          type: "error",
          message: `Item ${i + 1}: bucket is required`,
        });
        setLoading(false);
        return;
      }
      if (!item.categoryId) {
        setAlert({
          type: "error",
          message: `Item ${i + 1}: category is required`,
        });
        setLoading(false);
        return;
      }

      const valueNumber = parseFloat(item.value);
      if (Number.isNaN(valueNumber)) {
        setAlert({
          type: "error",
          message: `Item ${i + 1}: value must be a valid number`,
        });
        setLoading(false);
        return;
      }

      const valueCents = Math.round(valueNumber * 100);

      processedItems.push({
        bucketId: item.bucketId,
        categoryId: item.categoryId,
        title: item.title.trim(),
        value: valueCents,
        description: item.description.trim(),
      });
    }

    try {
      await onSubmit({
        walletId,
        date,
        source,
        description,
        items: processedItems,
      });
    } catch (error) {
      setAlert({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
      });

      setLoading(false);
    }
  }

  if (!wallets || !buckets || !categories) {
    return <Spinner message="Loading form data" />;
  }

  const walletOptions = wallets.map((w) => ({
    value: w._id,
    label: w.name,
  }));

  const bucketOptions = buckets.map((b) => ({
    value: b._id,
    label: b.name,
  }));

  const categoryOptions = categories.map((c) => ({
    value: c._id,
    label: c.name,
  }));

  return (
    <div className="max-w-2xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Wallet"
              icon={LuWallet}
              name="walletId"
              value={walletId}
              onChange={handleWalletIdChange}
              placeholder="Select a wallet"
              options={walletOptions}
              autoFocus={true}
            />

            <Input
              label="Description"
              icon={LuFileText}
              type="text"
              name="description"
              value={description}
              onChange={handleDescriptionChange}
              placeholder="Optional notes..."
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Items</h2>

            <span className="text-secondary-4">
              Total: <Currency value={totalValue} />
            </span>
          </div>

          {items.map((item, index) => (
            <div
              key={index}
              className="rounded-lg border border-secondary-3 p-4"
            >
              <div className="flex flex-col gap-3">
                <div className="relative">
                  {items.length > 1 && (
                    <div className="absolute -top-1.5 right-0">
                      <Button
                        type="button"
                        icon={LuTrash}
                        iconPosition="left"
                        onClick={() => handleRemoveItem(index)}
                        size="xs"
                        variant="danger-ghost"
                      />
                    </div>
                  )}

                  <Input
                    label="Title"
                    icon={LuCaptions}
                    type="text"
                    name={`item-title-${index}`}
                    value={item.title}
                    onChange={(e) =>
                      handleItemChange(index, "title", e.target.value)
                    }
                    placeholder="Milk, Bread, Cleaning supplies..."
                    autoFocus={focusIndex === index}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <Select
                    label="Bucket"
                    icon={LuPackageOpen}
                    name={`item-bucket-${index}`}
                    value={item.bucketId}
                    onChange={(e) =>
                      handleItemChange(index, "bucketId", e.target.value)
                    }
                    placeholder="Select"
                    options={bucketOptions}
                  />

                  <Select
                    label="Category"
                    icon={LuFolder}
                    name={`item-category-${index}`}
                    value={item.categoryId}
                    onChange={(e) =>
                      handleItemChange(index, "categoryId", e.target.value)
                    }
                    placeholder="Select"
                    options={categoryOptions}
                  />

                  <Input
                    label="Value"
                    icon={LuCreditCard}
                    type="text"
                    name={`item-value-${index}`}
                    value={item.value}
                    onChange={(e) =>
                      handleItemChange(index, "value", e.target.value)
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          ))}

          <Button
            type="button"
            label="Add item"
            icon={LuPlus}
            iconPosition="left"
            variant="outline"
            onClick={handleAddItem}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Source"
            icon={LuCreditCard}
            type="text"
            name="source"
            value={source}
            onChange={handleSourceChange}
            placeholder="Store name, Service provider..."
          />

          <Input
            label="Date"
            icon={LuCalendar}
            type="date"
            name="date"
            value={date}
            onChange={handleDateChange}
          />
        </div>

        {alert.message && <Alert type={alert.type} message={alert.message} />}

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            label="Cancel"
            variant="outline"
            onClick={handleCancel}
          />

          <Button loading={loading} type="submit" label={submitLabel} />
        </div>
      </form>
    </div>
  );
}
