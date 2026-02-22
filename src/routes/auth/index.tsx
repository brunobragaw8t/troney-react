import { useAuthActions } from "@convex-dev/auth/react";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AiOutlineGoogle } from "react-icons/ai";
import { Button } from "../../components/ui/button/button";

export const Route = createFileRoute("/auth/")({
  component: RouteComponent,
});

export type Form = "login" | "register" | "recover";

function RouteComponent() {
  const [isLoading, setIsLoading] = useState(false);

  const { signIn } = useAuthActions();

  function signInWithGoogle() {
    setIsLoading(true);
    signIn("google", { redirectTo: "/control-panel" });
  }

  return (
    <>
      <Button
        type="button"
        onClick={signInWithGoogle}
        loading={isLoading}
        label="Sign in with Google"
        icon={AiOutlineGoogle}
        iconPosition="left"
      />
    </>
  );
}
