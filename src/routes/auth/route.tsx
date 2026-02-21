import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Logo } from "../../components/brand/logo";

export const Route = createFileRoute("/auth")({
  component: RouteComponent,
});

function RouteComponent() {
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

        <Outlet />
      </div>
    </main>
  );
}
