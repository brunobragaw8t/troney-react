import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { LuWallet } from "react-icons/lu";
import { Alert, type AlertProps } from "../ui/alert/alert";
import { Button } from "../ui/button/button";
import { Input } from "../ui/input/input";

export interface WalletFormData {
  name: string;
  balance?: number;
}

interface WalletFormProps {
  initialName?: string;
  initialBalance?: number;
  inputBalance?: boolean;
  submitLabel: string;
  onSubmit: (data: WalletFormData) => Promise<void>;
}

export function WalletForm({
  initialName = "",
  initialBalance = 0,
  inputBalance = true,
  submitLabel,
  onSubmit,
}: WalletFormProps) {
  const [name, setName] = useState(initialName);

  function handleNameChange(event: React.ChangeEvent<HTMLInputElement>) {
    setName(event.target.value);
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
    navigate({ to: "/wallets" });
  }

  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setAlert({ type: "success", message: "" });

    let balanceCents: number | undefined;
    if (inputBalance) {
      const balanceNumber = Number(balance);
      if (Number.isNaN(balanceNumber) || balanceNumber < 0) {
        setAlert({
          type: "error",
          message: "Balance must be a positive number",
        });
        setLoading(false);
        return;
      }
      balanceCents = Math.round(balanceNumber * 100);
    }

    try {
      await onSubmit({
        name,
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
          icon={LuWallet}
          type="text"
          name="name"
          value={name}
          onChange={handleNameChange}
          placeholder="Bank, Cash, Savings..."
          autoFocus={true}
        />

        <Input
          label="Balance"
          icon={LuWallet}
          type="text"
          name="balance"
          value={balance}
          onChange={handleBalanceChange}
          placeholder="0.00"
          disabled={!inputBalance}
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
