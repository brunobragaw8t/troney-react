# PRD: MCP Server

Troney should expose its functionality as a first-party MCP server, so users can connect their AI agents and ask things like "register a $32 dinner expense" or
"how much did I spend on groceries this month?".

## Goals

- Users connect any MCP client to Troney with per-user credentials.
- Agents can read data (expenses, earnings, wallets, buckets, categories) and
  write data (register and update expenses and earnings) through high-level,
  schema'd tools.
- Access is per-user and revocable: there is a single token type, read-write.

## Non-goals (for v1)

- Full OAuth 2.1 server with dynamic client registration (possible later;
  personal access tokens are the pragmatic first step, mirroring Stripe's
  "agent API key" direction).
- In-browser WebMCP tools (separate, later feature).
- Tools for movements, creation of expense groups, or recurring expenses
  (can be added incrementally on the same foundation — v1 is expenses-only;
  earnings tools were added later in Phase 5 of the plan).
  Existing expense-group line items are visible via `list_expenses` with their
  `groupId` and group totals via the read-only `list_expense_groups`; agents
  cannot create or edit groups.
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
  resolved names, including expense-group line items (non-null `groupId`).
- `list_expense_groups(dateFrom?, dateTo?, limit?)` — read-only group-level
  totals and category/bucket breakdowns.
- `list_earnings(dateFrom?, dateTo?, limit?)` — latest first, with the resolved
  wallet name and the bucket allocations created with each earning.

Write:

- `register_expense(title, value, date, wallet, bucket, category, description?,
source?, idempotencyKey?)` — resolves names to IDs and returns the created
  (or reused) expense `id`. A repeated `idempotencyKey` is a no-op, so agent
  retries cannot double-charge the wallet and bucket.
- `register_earning(title, value, date, wallet, description?, source?)` —
  resolves the wallet by name and allocates the positive value to buckets by
  their budgets (which must total 100%).
- `update_earning(id, ...)` — partially updates an earning; wallet balance and
  bucket allocations are recalculated.

## Money format

All tools accept and return decimal currency values (e.g. `32.5`), matching
what agents read off receipts. Conversion to integer cents happens internally
only; it never leaks into tool inputs or outputs. Only exact-cent amounts are
accepted — sub-cent values (e.g. `0.001`) and binary-float artifacts (e.g.
`1.005`) are rejected rather than silently rounded. Dates are calendar-valid
`YYYY-MM-DD` strings.

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
by hash in a new `mcpTokens` table (`userId`, `tokenHash`, `name`, `createdAt`,
optional `lastUsedAt`). Tokens are valid until revoked; all tokens are
read-write.

## Architecture

- Convex `httpAction` on the existing HTTP router (`convex/http.ts`), path
  `/api/mcp`.
- `@modelcontextprotocol/sdk` low-level `Server` + stateless
  `WebStandardStreamableHTTPServerTransport` (JSON responses, no long-lived SSE
  — fits Convex httpAction model and avoids zod-version coupling). Tool JSON
  Schemas are derived from the Zod argument schemas via `z.toJSONSchema`.
- Tool handlers use `ctx.runQuery`/`ctx.runMutation` against **internal**
  queries/mutations that take an explicit `userId` (resolved from the token),
  sharing validation logic with the public mutations.
- Connection snippets live in settings and use the `.convex.site` URL (HTTP
  actions), not the `.convex.cloud` client URL.

## Status

Implemented and verified end-to-end against the dev deployment with a real MCP
client: six tools listed, group totals and line items read, and an idempotent
expense registration returning the same id twice without a duplicate charge.
Static checks pass (prettier, Convex typecheck, lint with 0 errors, build). No
tests are committed; temporary verification scripts and fixture data were
deleted. Production URL testing remains pending until a production deployment
is provided.

Post-v1 additions on the same foundation: `update_expense`, then `list_earnings`,
`register_earning` and `update_earning` (plan Phase 5). The v1 tool counts above
refer to the original six-tool surface.
