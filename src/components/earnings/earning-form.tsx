import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useState } from "react";
import {
  LuCalendar,
  LuCaptions,
  LuFileText,
  LuTrendingUp,
  LuWallet,
} from "react-icons/lu";
import { api } from "../../../convex/_generated/api";
import { Alert, type AlertProps } from "../ui/alert/alert";
import { Button } from "../ui/button/button";
import { Input } from "../ui/input/input";
import { Select } from "../ui/select/select";
import { Spinner } from "../ui/spinner/spinner";

export interface EarningFormData {
  walletId: string;
  title: string;
  description: string;
  value: number;
  source: string;
  date: string;
}

interface EarningFormProps {
  initialWalletId?: string;
  initialTitle?: string;
  initialDescription?: string;
  initialValue?: number;
  initialSource?: string;
  initialDate?: string;
  submitLabel: string;
  onSubmit: (data: EarningFormData) => Promise<void>;
}

export function EarningForm({
  initialWalletId = "",
  initialTitle = "",
  initialDescription = "",
  initialValue = 0,
  initialSource = "",
  initialDate = "",
  submitLabel,
  onSubmit,
}: EarningFormProps) {
  const [walletId, setWalletId] = useState(initialWalletId);

  function handleWalletIdChange(event: React.ChangeEvent<HTMLSelectElement>) {
    setWalletId(event.target.value);
  }

  const [title, setTitle] = useState(initialTitle);

  function handleTitleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setTitle(event.target.value);
  }

  const [description, setDescription] = useState(initialDescription);

  function handleDescriptionChange(event: React.ChangeEvent<HTMLInputElement>) {
    setDescription(event.target.value);
  }

  const [value, setValue] = useState(
    initialValue ? String(initialValue / 100) : "",
  );

  function handleValueChange(event: React.ChangeEvent<HTMLInputElement>) {
    setValue(event.target.value);
  }

  const [source, setSource] = useState(initialSource);

  function handleSourceChange(event: React.ChangeEvent<HTMLInputElement>) {
    setSource(event.target.value);
  }

  const [date, setDate] = useState(initialDate);

  function handleDateChange(event: React.ChangeEvent<HTMLInputElement>) {
    setDate(event.target.value);
  }

  const [alert, setAlert] = useState<AlertProps>({
    type: "success",
    message: "",
  });

  const navigate = useNavigate();

  function handleCancel() {
    navigate({ to: "/earnings" });
  }

  const [loading, setLoading] = useState(false);

  const wallets = useQuery(api.wallets.getWallets);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setAlert({ type: "success", message: "" });

    const valueNumber = parseFloat(value);
    if (Number.isNaN(valueNumber) || valueNumber <= 0) {
      setAlert({
        type: "error",
        message: "Value must be a number greater than 0",
      });
      setLoading(false);
      return;
    }

    const valueCents = Math.round(valueNumber * 100);

    try {
      await onSubmit({
        walletId,
        title,
        description,
        value: valueCents,
        source,
        date,
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

  if (!wallets) {
    return <Spinner message="Loading form data" />;
  }

  const walletOptions = wallets.map((w) => ({
    value: w._id,
    label: w.name,
  }));

  return (
    <div className="max-w-md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          label="Title"
          icon={LuCaptions}
          type="text"
          name="title"
          value={title}
          onChange={handleTitleChange}
          placeholder="Salary, Freelance, Gift..."
        />

        <Input
          label="Description"
          icon={LuFileText}
          type="text"
          name="description"
          value={description}
          onChange={handleDescriptionChange}
          placeholder="Optional description"
        />

        <Input
          label="Value"
          icon={LuTrendingUp}
          type="text"
          name="value"
          value={value}
          onChange={handleValueChange}
          placeholder="0.00"
        />

        <Input
          label="Source"
          icon={LuTrendingUp}
          type="text"
          name="source"
          value={source}
          onChange={handleSourceChange}
          placeholder="Company, Client..."
        />

        <Input
          label="Date"
          icon={LuCalendar}
          type="date"
          name="date"
          value={date}
          onChange={handleDateChange}
        />

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
