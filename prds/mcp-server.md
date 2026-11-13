# PRD: MCP Server

Troney should expose its functionality as a first-party MCP server, so users can connect their AI agents and ask things like "register a $32 dinner expense" or
"how much did I spend on groceries this month?".

## Goals

- Users connect any MCP client to Troney with per-user credentials.
- Agents can read data (expenses, wallets, buckets, categories) and write data
  (register expenses) through high-level, schema'd tools.
- Access is per-user and revocable: there is a single token type, read-write.

## Non-goals (for v1)

- Full OAuth 2.1 server with dynamic client registration (possible later;
  personal access tokens are the pragmatic first step, mirroring Stripe's
  "agent API key" direction).
- In-browser WebMCP tools (separate, later feature).
- Tools for movements, expense groups, earnings, or recurring expenses
  (can be added incrementally on the same foundation — v1 is expenses-only).
- Read-only vs read-write token scopes (single-user app; all tokens read-write).

## User stories

1. As a user, I can generate a personal access token in Troney and paste it
   into my agent's MCP config, so my agent can act on my behalf.
2. As a user, I can list and revoke my tokens, so a leaked token can't be
   reused.
3. As an agent, I can register an expense by wallet/bucket/category **name**
   (no Convex IDs), so natural language maps directly to tool calls.
4. As an agent, I can list recent expenses in a date range, so I can answer
   questions about the user's finances.
5. As a user, I can see an "use with your AI agent" doc snippet telling me how
   to connect Claude Desktop / Claude Code / any MCP client.

## Tool surface (v1)

Read:
- `list_wallets`, `list_buckets`, `list_categories` — context for resolving
  names.
- `list_expenses(dateFrom, dateTo?, limit?)` — paginated recent expenses with
  resolved names.

Write:
- `register_expense(title, value, date, wallet, bucket, category, description?,
  source?)` — resolves names to IDs and returns the created expense.

## Money format

All tools accept and return decimal currency values (e.g. `32.5`), matching
what agents read off receipts. Conversion to integer cents happens internally
only; it never leaks into tool inputs or outputs.

Errors are structured and actionable: unknown wallet/bucket/category returns
the list of valid names so the agent can self-correct in one round trip.

## Safety

- Tokens stored hashed (SHA-256); plaintext shown once at creation.
- Tokens are valid until revoked (no expiry), are all read-write (the sole
  user's main use case is registering expenses from receipts), and can be
  revoked at any time.
- Tool-level input validation identical to existing mutations (title length,
  etc.) via reusing the same internal logic.
- MCP clients themselves prompt the user before tool calls; no extra
  confirmation UI in v1.

## Auth mechanism

`Authorization: Bearer <token>` header on `POST /api/mcp`. Token is looked up
by hash in a new `mcpTokens` table (`userId`, `tokenHash`, `name`,
`lastUsedAt`, timestamps). Tokens are valid until revoked; all tokens are
read-write.

## Architecture

- Convex `httpAction` on the existing HTTP router (`convex/http.ts`), path
  `/api/mcp`.
- `@modelcontextprotocol/sdk` `McpServer` + stateless `StreamableHTTPServerTransport`
  (JSON responses, no long-lived SSE — fits Convex httpAction model).
- Tool handlers use `ctx.runQuery`/`ctx.runMutation` against **internal**
  queries/mutations that take an explicit `userId` (resolved from the token),
  sharing validation logic with the public mutations.
