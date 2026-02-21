import { useState } from "react";
import type { Form } from "../../routes/auth";
import { Input } from "../ui/input/input";
import { Mail } from "lucide-react";
import { Button } from "../ui/button/button";
import { AuthFormFooter } from "./auth-form-footer";

interface Props {
  className?: string;
  email: string;
  onEmailChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  setForm: (form: Form) => void;
}

export function RecoverForm({
  className,
  email,
  onEmailChange,
  setForm,
}: Props) {
  const [loading, setLoading] = useState(false);

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
  }

  function goToLoginForm() {
    setForm("login");
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <Input
        label="Email"
        icon={Mail}
        type="email"
        name="email"
        value={email}
        onChange={onEmailChange}
        placeholder="Enter your email"
        autoFocus={true}
      />

      <Button loading={loading} type="submit" label="Recover" />

      <AuthFormFooter
        buttonLabel="Return to login"
        buttonAction={goToLoginForm}
      />
    </form>
  );
}
