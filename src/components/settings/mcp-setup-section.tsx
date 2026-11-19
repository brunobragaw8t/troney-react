import { useState } from "react";
import { LuCheck, LuCopy } from "react-icons/lu";
import { Button } from "../ui/button/button";

const endpoint = `${(import.meta.env.VITE_CONVEX_SITE_URL as string).replace(/\/$/, "")}/api/mcp`;
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
        buckets, categories and expenses (including expense-group line items)
        and register new expenses. Creating expense groups is not supported yet.
      </p>

      <Snippet label="Claude Code" code={claudeCodeCommand} />
      <Snippet label="Claude Desktop" code={claudeDesktopConfig} />
      <Snippet label="Other MCP clients" code={genericConfig} />
    </section>
  );
}
