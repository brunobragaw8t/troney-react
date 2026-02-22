import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { AiOutlineGoogle } from "react-icons/ai";
import { Logo } from "../../components/brand/logo";
import { Button } from "../ui/button/button";

export function AuthLayout() {
  const [isLoading, setIsLoading] = useState(false);

  const { signIn } = useAuthActions();

  function signInWithGoogle() {
    setIsLoading(true);
    signIn("google", { redirectTo: "/control-panel" });
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="flex w-96 flex-col gap-8 rounded-xl bg-secondary-2 p-8">
        <div className="flex flex-col gap-4">
          <div className="flex justify-center">
            <Logo />
          </div>

          <span className="text-center font-medium text-secondary-4">
            Track your expenses with ease
          </span>
        </div>

        <Button
          type="button"
          onClick={signInWithGoogle}
          loading={isLoading}
          label="Sign in with Google"
          icon={AiOutlineGoogle}
          iconPosition="left"
        />
      </div>
    </main>
  );
}
