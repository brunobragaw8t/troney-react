import { Outlet } from "@tanstack/react-router";
import { BalanceVisibilityProvider } from "../../contexts/balance-visibility-context";
import { Logo } from "../brand/logo";
import { useAuthActions } from "@convex-dev/auth/react";

export function MainLayout() {
  const { signOut } = useAuthActions();

  return (
    <BalanceVisibilityProvider>
      <div className="flex min-h-screen">
        <aside className="flex w-64 shrink-0 flex-col gap-5 border-r border-secondary-3 bg-secondary-2 p-6">
          <Logo />
          {/* <AppMenu /> */}
          {/* <AppUser /> */}
          <button onClick={() => signOut()} className="text-white">
            logout
          </button>
        </aside>

        <main className="grow p-8">
          <Outlet />
        </main>
      </div>
    </BalanceVisibilityProvider>
  );
}
