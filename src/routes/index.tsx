import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "../components/ui/button/button";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <div>Hello "/"!</div>

      <Button
        type="button"
        onClick={() => setCount((count) => count + 1)}
        label={`count is ${count}`}
        variant="primary"
      />

      <Button type="link" href="/about" label="About" />
    </div>
  );
}
