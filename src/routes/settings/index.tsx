import { createFileRoute } from "@tanstack/react-router";
import { McpTokensSection } from "../../components/settings/mcp-tokens-section";

export const Route = createFileRoute("/settings/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <div className="mb-4">
        <h1 className="mb-2 text-3xl font-bold text-white">Settings</h1>
        <p className="text-secondary-4">Configure Troney and integrations</p>
      </div>

      <McpTokensSection />
    </>
  );
}
