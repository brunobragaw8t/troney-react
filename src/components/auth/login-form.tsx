import { useState } from "react";
import type { Form } from "../../routes/auth";
import { Alert, type AlertProps } from "../ui/alert/alert";
import { Input } from "../ui/input/input";
import { Eye, EyeClosed, Key, Mail } from "lucide-react";
import { Checkbox } from "../ui/checkbox/checkbox";
import { Button } from "../ui/button/button";
import { AuthFormFooter } from "./auth-form-footer";

interface Props {
  className?: string;
  email: string;
  onEmailChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  setForm: (form: Form) => void;
}

export function LoginForm({ className, email, onEmailChange, setForm }: Props) {
  const [password, setPassword] = useState("");

  function handlePasswordChange(event: React.ChangeEvent<HTMLInputElement>) {
    setPassword(event.target.value);
  }

  const [displayPasswordAsText, setDisplayPasswordAsText] = useState(false);

  function toggleDisplayPasswordAsText() {
    setDisplayPasswordAsText(!displayPasswordAsText);
  }

  const [rememberMe, setRememberMe] = useState(false);

  function handleRememberMeChange() {
    setRememberMe(!rememberMe);
  }

  const [loading, setLoading] = useState(false);

  const [alert, setAlert] = useState<AlertProps>({
    type: "success",
    message: "",
  });

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);

    setAlert({
      type: "success",
      message: "",
    });
  }

  function goToRecoverForm() {
    setForm("recover");
  }

  function goToRegisterForm() {
    setForm("register");
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
      />

      <div className="flex justify-between">
        <div>
          <Checkbox
            label="Remember me"
            name="remember"
            value=""
            checked={rememberMe}
            onChange={handleRememberMeChange}
          />
        </div>

        <button
          type="button"
          onClick={goToRecoverForm}
          className="rounded border border-transparent text-sm font-medium text-primary-1 outline-none hover:text-primary-2 focus:border-white"
        >
          Forgot password?
        </button>
      </div>

      {alert.message && <Alert type={alert.type} message={alert.message} />}

      <Button loading={loading} type="submit" label="Login" />

      <AuthFormFooter
        label="Don't have an account?"
        buttonLabel="Sign up"
        buttonAction={goToRegisterForm}
      />
    </form>
  );
}
