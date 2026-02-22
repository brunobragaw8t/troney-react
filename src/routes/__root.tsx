import { createRootRouteWithContext } from "@tanstack/react-router";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  type ConvexReactClient,
} from "convex/react";
import { AuthLayout } from "../components/layouts/auth";
import { MainLayout } from "../components/layouts/main";
import { Spinner } from "../components/ui/spinner/spinner";

interface RouterContext {
  auth: ConvexReactClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  return (
    <>
      <AuthLoading>
        <div className="flex min-h-screen items-center justify-center">
          <Spinner />
        </div>
      </AuthLoading>

      <Unauthenticated>
        <AuthLayout />
      </Unauthenticated>

      <Authenticated>
        <MainLayout />
      </Authenticated>
    </>
  );
}
