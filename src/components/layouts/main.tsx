import { Outlet } from "@tanstack/react-router";
import { BalanceVisibilityProvider } from "../../contexts/balance-visibility-context";
import { Logo } from "../brand/logo";
import { AppMenu } from "../ui/app-menu/app-menu";
import { AppUser } from "../ui/app-user/app-user";

export function MainLayout() {
  return (
    <BalanceVisibilityProvider>
      <div className="flex min-h-screen">
        <aside className="flex w-64 shrink-0 flex-col gap-5 border-r border-secondary-3 bg-secondary-2 p-6">
          <Logo />
          <AppMenu />
          <AppUser />
        </aside>

        <main className="grow p-8">
          <Outlet />
        </main>
      </div>
    </BalanceVisibilityProvider>
  );
}
