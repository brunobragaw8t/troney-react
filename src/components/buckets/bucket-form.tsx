import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { LuPackageOpen, LuPercent, LuWallet } from "react-icons/lu";
import { Alert, type AlertProps } from "../ui/alert/alert";
import { Button } from "../ui/button/button";
import { Input } from "../ui/input/input";

export interface BucketFormData {
  name: string;
  budget: number;
  balance?: number;
}

interface BucketFormProps {
  initialName?: string;
  initialBudget?: number;
  initialBalance?: number;
  showBalance?: boolean;
  submitLabel: string;
  onSubmit: (data: BucketFormData) => Promise<void>;
}

export function BucketForm({
  initialName = "",
  initialBudget = 0,
  initialBalance = 0,
  showBalance = false,
  submitLabel,
  onSubmit,
}: BucketFormProps) {
  const [name, setName] = useState(initialName);

  function handleNameChange(event: React.ChangeEvent<HTMLInputElement>) {
    setName(event.target.value);
  }

  const [budget, setBudget] = useState(String(initialBudget));

  function handleBudgetChange(event: React.ChangeEvent<HTMLInputElement>) {
    setBudget(event.target.value);
  }

  const [balance, setBalance] = useState(
    initialBalance ? String(initialBalance / 100) : "",
  );

  function handleBalanceChange(event: React.ChangeEvent<HTMLInputElement>) {
    setBalance(event.target.value);
  }

  const [alert, setAlert] = useState<AlertProps>({
    type: "success",
    message: "",
  });

  const navigate = useNavigate();

  function handleCancel() {
    navigate({ to: "/buckets" });
  }

  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setAlert({ type: "success", message: "" });

    const budgetNumber = Number(budget);
    if (Number.isNaN(budgetNumber) || budgetNumber < 0 || budgetNumber > 100) {
      setAlert({
        type: "error",
        message: "Budget must be a number between 0 and 100",
      });
      setLoading(false);
      return;
    }

    let balanceCents: number | undefined;
    if (showBalance) {
      const balanceNumber = Number(balance);
      if (Number.isNaN(balanceNumber) || balanceNumber < 0) {
        setAlert({
          type: "error",
          message: "Balance must be a non-negative number",
        });
        setLoading(false);
        return;
      }
      balanceCents = Math.round(balanceNumber * 100);
    }

    try {
      await onSubmit({
        name,
        budget: budgetNumber,
        balance: balanceCents,
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

  return (
    <div className="max-w-md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Name"
          icon={LuPackageOpen}
          type="text"
          name="name"
          value={name}
          onChange={handleNameChange}
          placeholder="Essentials, Savings, Fun..."
          autoFocus={true}
        />

        <Input
          label="Budget"
          icon={LuPercent}
          type="text"
          name="budget"
          value={budget}
          onChange={handleBudgetChange}
          placeholder="0"
        />

        {showBalance && (
          <Input
            label="Balance"
            icon={LuWallet}
            type="text"
            name="balance"
            value={balance}
            onChange={handleBalanceChange}
            placeholder="0.00"
          />
        )}

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
