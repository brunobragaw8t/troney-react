import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { LuEye, LuEyeOff, LuLogOut } from "react-icons/lu";
import { useBalanceVisibility } from "../../../contexts/balance-visibility-context";
import { Tooltip } from "../tooltip/tooltip";
import { Keymap } from "../keymap/keymap";

export function AppUser() {
  const user = useQuery(api.users.currentUser);
  const userName = user ? user.name?.split(" ")[0] : null;

  const { isHidden, toggle } = useBalanceVisibility();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { signOut } = useAuthActions();
  const navigate = useNavigate();

  async function handleLogout() {
    setIsLoggingOut(true);
    await signOut();
    navigate({ to: "/auth" });
  }

  return (
    <div className="mt-auto flex items-center justify-end gap-2 text-secondary-4">
      {userName && <span className="mr-auto">{userName}</span>}

      <button
        type="button"
        className="group relative hover:text-primary-1"
        onClick={toggle}
      >
        {isHidden ? (
          <LuEyeOff size={20} className="my-1" />
        ) : (
          <LuEye size={20} className="my-1" />
        )}

        <Tooltip>
          {isHidden ? "Show balances" : "Hide balances"}
          <Keymap text="H" />
        </Tooltip>
      </button>

      <button
        type="button"
        className={`group relative hover:text-red-500 ${isLoggingOut ? "cursor-wait opacity-50" : ""}`}
        onClick={handleLogout}
      >
        <LuLogOut size={20} className="my-1" />

        <Tooltip>Logout</Tooltip>
      </button>
    </div>
  );
}
