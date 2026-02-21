import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/control-panel/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Control Panel</div>;
}
