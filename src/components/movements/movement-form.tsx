import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useState } from "react";
import { LuArrowLeftRight, LuCalendar, LuWallet } from "react-icons/lu";
import { api } from "../../../convex/_generated/api";
import { Alert, type AlertProps } from "../ui/alert/alert";
import { Button } from "../ui/button/button";
import { Input } from "../ui/input/input";
import { Select } from "../ui/select/select";
import { Spinner } from "../ui/spinner/spinner";

export interface MovementFormData {
  walletIdSource: string;
  walletIdTarget: string;
  value: number;
  date: string;
}

interface MovementFormProps {
  initialWalletIdSource?: string;
  initialWalletIdTarget?: string;
  initialValue?: number;
  initialDate?: string;
  submitLabel: string;
  onSubmit: (data: MovementFormData) => Promise<void>;
}

export function MovementForm({
  initialWalletIdSource = "",
  initialWalletIdTarget = "",
  initialValue = 0,
  initialDate = "",
  submitLabel,
  onSubmit,
}: MovementFormProps) {
  const [walletIdSource, setWalletIdSource] = useState(initialWalletIdSource);

  function handleWalletIdSourceChange(
    event: React.ChangeEvent<HTMLSelectElement>,
  ) {
    setWalletIdSource(event.target.value);
  }

  const [walletIdTarget, setWalletIdTarget] = useState(initialWalletIdTarget);

  function handleWalletIdTargetChange(
    event: React.ChangeEvent<HTMLSelectElement>,
  ) {
    setWalletIdTarget(event.target.value);
  }

  const [value, setValue] = useState(
    initialValue ? String(initialValue / 100) : "",
  );

  function handleValueChange(event: React.ChangeEvent<HTMLInputElement>) {
    setValue(event.target.value);
  }

  const [date, setDate] = useState(
    initialDate || new Date().toISOString().split("T")[0],
  );

  function handleDateChange(event: React.ChangeEvent<HTMLInputElement>) {
    setDate(event.target.value);
  }

  const [alert, setAlert] = useState<AlertProps>({
    type: "success",
    message: "",
  });

  const navigate = useNavigate();

  function handleCancel() {
    navigate({ to: "/movements" });
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
        walletIdSource,
        walletIdTarget,
        value: valueCents,
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
          label="Source wallet"
          icon={LuWallet}
          name="walletIdSource"
          value={walletIdSource}
          onChange={handleWalletIdSourceChange}
          placeholder="Select source wallet"
          options={walletOptions}
          autoFocus={true}
        />

        <Select
          label="Target wallet"
          icon={LuWallet}
          name="walletIdTarget"
          value={walletIdTarget}
          onChange={handleWalletIdTargetChange}
          placeholder="Select target wallet"
          options={walletOptions}
        />

        <Input
          label="Value"
          icon={LuArrowLeftRight}
          type="text"
          name="value"
          value={value}
          onChange={handleValueChange}
          placeholder="0.00"
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
