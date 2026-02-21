import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { LoginForm } from "../../components/auth/login-form";
import { RecoverForm } from "../../components/auth/recover-form";
import { RegisterForm } from "../../components/auth/register-form";

export const Route = createFileRoute("/auth/")({
  component: RouteComponent,
});

export type Form = "login" | "register" | "recover";

function RouteComponent() {
  const [form, setForm] = useState<Form>("login");

  const className = "flex flex-col gap-4";

  const [email, setEmail] = useState("");

  function handleEmailChange(evt: React.ChangeEvent<HTMLInputElement>) {
    setEmail(evt.target.value);
  }

  return (
    <>
      {form === "login" && (
        <LoginForm
          className={className}
          email={email}
          onEmailChange={handleEmailChange}
          setForm={setForm}
        />
      )}

      {form === "recover" && (
        <RecoverForm
          className={className}
          email={email}
          onEmailChange={handleEmailChange}
          setForm={setForm}
        />
      )}

      {form === "register" && (
        <RegisterForm
          className={className}
          email={email}
          onEmailChange={handleEmailChange}
          setForm={setForm}
        />
      )}
    </>
  );
}
