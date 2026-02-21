import { useAuthActions } from "@convex-dev/auth/react";
import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeClosed, Key, Mail, User } from "lucide-react";
import { useState } from "react";
import z, { treeifyError } from "zod";
import type { $ZodErrorTree } from "zod/v4/core";
import type { Form } from "../../routes/auth";
import { registerSchema } from "../../validation-schemas/register-schema";
import { Alert, type AlertProps } from "../ui/alert/alert";
import { Button } from "../ui/button/button";
import { Input } from "../ui/input/input";
import { AuthFormFooter } from "./auth-form-footer";

interface Props {
  className?: string;
  email: string;
  onEmailChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  setForm: (form: Form) => void;
}

export function RegisterForm({
  className,
  email,
  onEmailChange,
  setForm,
}: Props) {
  const { signIn } = useAuthActions();
  const navigate = useNavigate();

  /**
   * Fields
   */

  const [name, setName] = useState("");

  function handleNameChange(event: React.ChangeEvent<HTMLInputElement>) {
    setName(event.target.value);
  }

  const [password, setPassword] = useState("");

  function handlePasswordChange(event: React.ChangeEvent<HTMLInputElement>) {
    setPassword(event.target.value);
  }

  const [displayPasswordAsText, setDisplayPasswordAsText] = useState(false);

  function toggleDisplayPasswordAsText() {
    setDisplayPasswordAsText(!displayPasswordAsText);
  }

  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  function handlePasswordConfirmationChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    setPasswordConfirmation(event.target.value);
  }

  const [
    displayPasswordConfirmationAsText,
    setDisplayPasswordConfirmationAsText,
  ] = useState(false);

  function toggleDisplayPasswordConfirmationAsText() {
    setDisplayPasswordConfirmationAsText(!displayPasswordConfirmationAsText);
  }

  /**
   * Submit
   */

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<$ZodErrorTree<
    z.input<typeof registerSchema>
  > | null>(null);

  const [alert, setAlert] = useState<AlertProps>({
    type: "success",
    message: "",
  });

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrors(null);
    setAlert({ type: "success", message: "" });
    setDisplayPasswordAsText(false);
    setDisplayPasswordConfirmationAsText(false);

    const validationResult = registerSchema.safeParse({
      name,
      email,
      password,
      passwordConfirmation,
    });

    if (!validationResult.success) {
      setErrors(treeifyError(validationResult.error));
      return;
    }

    setLoading(true);

    try {
      await signIn("password", {
        name,
        email,
        password,
        flow: "signUp",
      });

      navigate({ to: "/control-panel" });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Registration failed";
      setAlert({ type: "error", message });
      setLoading(false);
    }
  }

  /**
   * Go to login form
   */

  function goToLoginForm() {
    setForm("login");
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <Input
        label="Name"
        icon={User}
        type="text"
        name="name"
        value={name}
        onChange={handleNameChange}
        placeholder="Enter your name"
        autoFocus={true}
        error={errors?.properties?.name?.errors}
      />

      <Input
        label="Email"
        icon={Mail}
        type="email"
        name="email"
        value={email}
        onChange={onEmailChange}
        placeholder="Enter your email"
        error={errors?.properties?.email?.errors}
      />

      <Input
        label="Password"
        icon={Key}
        type={displayPasswordAsText ? "text" : "password"}
        name="password"
        value={password}
        onChange={handlePasswordChange}
        placeholder="Enter your password"
        rightAccessoryIcon={displayPasswordAsText ? EyeClosed : Eye}
        rightAccessoryAction={toggleDisplayPasswordAsText}
        rightAccessoryLabel={
          displayPasswordAsText ? "Hide password" : "Show password"
        }
        error={errors?.properties?.password?.errors}
      />

      <Input
        label="Password confirmation"
        icon={Key}
        type={displayPasswordConfirmationAsText ? "text" : "password"}
        name="password_confirmation"
        value={passwordConfirmation}
        onChange={handlePasswordConfirmationChange}
        placeholder="Repeat your password"
        rightAccessoryIcon={displayPasswordConfirmationAsText ? EyeClosed : Eye}
        rightAccessoryAction={toggleDisplayPasswordConfirmationAsText}
        rightAccessoryLabel={
          displayPasswordConfirmationAsText ? "Hide password" : "Show password"
        }
        error={errors?.properties?.passwordConfirmation?.errors}
      />

      {alert.message && <Alert type={alert.type} message={alert.message} />}

      <Button loading={loading} type="submit" label="Register" />

      <AuthFormFooter
        label="Already have an account?"
        buttonLabel="Login"
        buttonAction={goToLoginForm}
      />
    </form>
  );
}
