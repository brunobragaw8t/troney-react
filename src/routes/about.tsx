import { createFileRoute } from "@tanstack/react-router";
import { Button } from "../components/ui/button/button";

export const Route = createFileRoute("/about")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <div>Hello "/about"!</div>
      <Button type="link" href="/" label="Home" />
    </div>
  );
}
