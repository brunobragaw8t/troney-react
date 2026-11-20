import { useState } from "react";
import { LuCheck, LuCopy } from "react-icons/lu";
import { Button } from "../ui/button/button";

const configuredSiteUrl = import.meta.env.VITE_CONVEX_SITE_URL as
  | string
  | undefined;
const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;

// VITE_CONVEX_SITE_URL is optional: derive the HTTP actions URL from the client
// URL when it isn't set (e.g. deployments that only configure VITE_CONVEX_URL).
const siteUrl = (configuredSiteUrl || convexUrl || "")
  .replace(/\/$/, "")
  .replace(/\.convex\.cloud$/, ".convex.site");

const endpoint = siteUrl
  ? `${siteUrl}/api/mcp`
  : "<YOUR_CONVEX_SITE_URL>/api/mcp";
const tokenPlaceholder = "<YOUR_TOKEN>";

const claudeCodeCommand = `claude mcp add troney --transport http ${endpoint} --header "Authorization: Bearer ${tokenPlaceholder}"`;

const claudeDesktopConfig = JSON.stringify(
  {
    mcpServers: {
      troney: {
        type: "http",
        url: endpoint,
        headers: { Authorization: `Bearer ${tokenPlaceholder}` },
      },
    },
  },
  null,
  2,
);

const genericConfig = `URL: ${endpoint}\nAuthorization: Bearer ${tokenPlaceholder}`;

function Snippet({ label, code }: { label: string; code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
  }

  return (
    <div className="mb-4">
      <p className="mb-2 text-sm font-bold text-white">{label}</p>

      <div className="flex max-w-2xl items-start gap-2">
        <pre className="flex-1 overflow-x-auto rounded-lg border border-secondary-3 bg-secondary-3/30 p-3 font-mono text-xs text-white">
          {code}
        </pre>

        <Button
          type="button"
          label={copied ? "Copied" : "Copy"}
          icon={copied ? LuCheck : LuCopy}
          iconPosition="left"
          onClick={handleCopy}
          size="sm"
          variant="primary-ghost"
        />
      </div>
    </div>
  );
}

export function McpSetupSection() {
  return (
    <section>
      <h2 className="mb-2 text-xl font-bold text-white">
        Use with your AI agent
      </h2>
      <p className="mb-4 max-w-2xl text-sm text-secondary-4">
        Create a token above, replace {tokenPlaceholder} in a snippet below,
        then paste it into your agent's config. Agents can list your wallets,
        buckets, categories, expenses (including expense-group line items) and
        earnings, and register or update expenses and earnings. Creating expense
        groups is not supported yet.
      </p>

      <Snippet label="Claude Code" code={claudeCodeCommand} />
      <Snippet label="Claude Desktop" code={claudeDesktopConfig} />
      <Snippet label="Other MCP clients" code={genericConfig} />
    </section>
  );
}
