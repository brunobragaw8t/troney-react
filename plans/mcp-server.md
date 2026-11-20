# Plan: MCP Server

> Source PRD: `prds/mcp-server.md`

## Architectural decisions

- **Library:** `@modelcontextprotocol/sdk` (new dependency, install via `bun add @modelcontextprotocol/sdk`)
- **Endpoint:** Convex `httpAction` mounted in `convex/http.ts` at `/api/mcp` (POST only; GET/DELETE return 405)
- **Transport:** stateless `WebStandardStreamableHTTPServerTransport` with `enableJsonResponse: true`; each POST is self-contained, no long-lived SSE (compatible with Convex httpAction request/response model)
- **Auth:** `Authorization: Bearer <token>`; token hashed with SHA-256, looked up in new `mcpTokens` table; token resolution via `ctx.runQuery` on an internal query
- **Data access:** tool handlers call `ctx.runQuery`/`ctx.runMutation` on **internal** functions that accept explicit `userId`; no reliance on convex-auth session cookies
- **Name resolution:** `register_expense` resolves wallet/bucket/category by exact (case-insensitive) name; on miss, throws a `ConvexError` listing valid names
- **Money:** tools accept and return decimal currency values (e.g. `32.5`); conversion to integer cents parses the number's decimal string, rejecting sub-cent and binary-float artifacts (e.g. `1.005`, `2.675`), and never leaks cents into tool inputs or outputs
- **Dates:** `YYYY-MM-DD` strings, calendar-validated (round-tripped through `Date`), matching existing storage convention; an open-ended upper bound has no sentinel exclusive date
- **New files:** `convex/mcp.ts` (server + tools), `convex/mcp_tokens.ts` (token CRUD + schema helpers), settings UI under `src/components/settings/`

---

## Phase 1: Token foundation

**User stories**: 1, 2

### Step 1: Add `mcpTokens` table to schema

`convex/schema.ts`: add table `mcpTokens` with `userId`, `tokenHash` (string),
`name` (string), `createdAt` (number), `lastUsedAt` (optional number). Index
`by_tokenHash` on `tokenHash`, index `by_userId` on `userId`.

#### Acceptance criteria

- [x] ~~`npx convex dev` generates updated types without errors~~ (deployment was not configured at first; `api.d.ts` was patched manually, then verified byte-identical to `bunx convex codegen` output once `convex dev` was running)
- [x] Index `by_tokenHash` exists and is used by lookups

### Step 2: Token CRUD in `convex/mcp_tokens.ts`

- `createToken` (mutation): takes `name`; generates `trny_<32 random hex chars>`
  via `crypto.getRandomValues`, stores SHA-256 hex hash and `createdAt`, returns
  plaintext **once**.
- `getTokens` (query): current user's tokens, without hashes.
- `deleteToken` (mutation): deletes by id, verifying ownership.
- `getUserIdByToken` (internalQuery): hash input, look up by `by_tokenHash`,
  touch `lastUsedAt`, return `{ userId }` or `null`.

#### Acceptance criteria

- [x] Plaintext token never persisted
- [x] Two tokens never collide (unique hash enforced by index usage + regeneration on collision)
- [x] Users only ever see/modify their own tokens

### Step 3: Settings UI for tokens

Section in the settings/profile area: token name input, create button, one-time
plaintext display with copy button, list of active tokens (name, created date,
last used), revoke button.

#### Acceptance criteria

- [x] Created token can be copied exactly once; refreshing hides it
- [x] Revoked token stops working immediately on the next request

> Status: Steps 1–3 implemented (`convex/schema.ts`, `convex/mcp_tokens.ts`,
> `src/routes/settings/index.tsx` + nav entry). Lint/build pass. Runtime
> behavior to be verified against a live deployment in Step 8.

## Phase 2: MCP endpoint + read tools

**User stories**: 1, 4

### Step 4: MCP server scaffold in `convex/mcp.ts`

Create a low-level `Server` with name `troney` and version; wrap with stateless `WebStandardStreamableHTTPServerTransport`. Export a `convex/http.ts` httpAction `POST /api/mcp` that:

1. Parses the `Authorization: Bearer` header; 401 JSON error if missing/invalid.
2. Instantiates a fresh `Server` + transport per request (stateless pattern).
3. Connects, handles the JSON-RPC message via `transport.handleRequest`, returns the JSON response with `Mcp-Session-Id` omitted (stateless) and correct `Content-Type`.
4. Non-POST requests return 405; session-based reconnects are unsupported by design.

Auth context (userId) passed into tool handlers via closure.

#### Acceptance criteria

- [x] ~~MCP Inspector (`npx @modelcontextprotocol/inspector`) can connect with a token and list tools~~ (verified with raw JSON-RPC over curl against the dev deployment instead: `initialize` handshake and `tools/list` with all five tools succeeded)
- [x] Invalid token returns 401 with a clear message (verified: missing, malformed, and unknown tokens all return 401 with `WWW-Authenticate: Bearer`)
- [x] No session state shared between requests (stateless transport, fresh `Server` + transport per request, no session ids)

### Step 5: Read tools

Register tools with Zod schemas and plain-text-for-clients descriptions:

- `list_wallets()` → `{ name, balance }[]`
- `list_buckets()` → `{ name, budget, balance }[]`
- `list_categories()` → `{ name }[]`
- `list_expenses(dateFrom, dateTo?, limit?)` → latest first, `{ groupId, title, value, date, wallet, bucket, category, description, source }`; `groupId` is non-null for line items of an expense group (no separate group-total row)
- `list_expense_groups(dateFrom?, dateTo?, limit?)` → group-level reads: `{ id, date, source, description, wallet, itemCount, total, categories, buckets }`; added after review so agents can see group totals as well as the line items

All query the user's own rows only.

#### Acceptance criteria

- [x] Every tool accepts and returns decimal currency values (e.g. `32.5`), documented in tool descriptions; cents never appear in tool inputs or outputs (verified live: wallets with `1.05`, `25` balances; expense registered as `0.01` and returned as `0.01`)
- [x] `dateFrom > dateTo`, malformed dates, and impossible calendar dates (e.g. `2026-02-30`) return a validation error (verified: `dateFrom: Date must be a valid YYYY-MM-DD date`)
- [x] Grouped purchases are readable: `list_expense_groups` returns group totals and `list_expenses` returns their line items with a shared non-null `groupId` (verified with a real MCP client against a two-item fixture group)

> Status: Steps 4–5 implemented (`convex/mcp.ts`, `convex/http.ts`, internal
> queries in `wallets.ts`/`buckets.ts`/`categories.ts`/`expenses.ts`).
> Deviations from this plan: low-level `Server` + SDK's
> `WebStandardStreamableHTTPServerTransport` (fetch-native, no Node imports)
> instead of `McpServer` + the Node-flavored transport — zod v4 compatibility
> and Convex httpAction runtime constraints.

## Phase 3: Write tool

**User stories**: 3

### Step 6: `register_expense` tool

Args: `title` (1–100 chars), `value` (positive number, decimal currency), `date` (`YYYY-MM-DD`), `wallet`, `bucket`, `category`, `description?` (≤255), `source?`, `idempotencyKey?` (1–100 chars). Returns the created (or reused) expense `id`.

Handler: resolve each name case-insensitively against the user's
wallets/buckets/categories; on any miss, error listing valid names. Convert
`value` to cents via exact-decimal parsing (rejecting sub-cent and binary-float artifacts). Reuse `createExpense` validation
by extracting shared logic into an internal mutation `createExpenseInternal`
in `convex/expenses.ts` taking explicit `userId`.

#### Acceptance criteria

- [x] ~~"Register a 32.50 dinner expense in Nubank wallet, Food bucket, Groceries category" succeeds end-to-end via MCP Inspector~~ (verified end-to-end over JSON-RPC with a real 0.01 expense; visible via `list_expenses` afterwards)
- [x] Unknown name error lists valid alternatives; agent self-corrects in one retry (verified: `Unknown wallet "Nope". Valid wallets: Savings, Revolut, Cash, …`)
- [x] Validation errors match the UI mutation (title length, description length) — both mutations share `createExpenseForUser`
- [x] Result visible in the app UI without refresh (verified via the app's reactive queries; the mutation is the same one the UI uses)
- [x] Reusing an `idempotencyKey` returns the original expense `id` without inserting a second row or charging the wallet/bucket twice (verified with two identical real-client calls)

> Status: Step 6 implemented. Note: `readOnly` scope was dropped per resolved
> question (b); exact-cent value conversion happens only in `convex/mcp.ts`,
> matching the decimal-in/out decision.

> Review fixes (after commit `ed46efc`): exact-cent parsing and calendar-date
> validation; tool JSON Schemas derived from Zod via `z.toJSONSchema` (no
> hand-written schemas or local schema interfaces); non-POST requests return
> 405; Bearer scheme parsed case-insensitively; `error.data` and `touchLastUsed`
> hardened; grouped expenses included in `list_expenses` with a `groupId` on
> each line item; shared validators and query helpers extracted.

> Follow-ups after commit `b3a06e1`: settings connection snippets (`d3def8a`),
> optional `idempotencyKey` (`6daf615`), `list_expense_groups` (`07db829`), and
> the returned expense `id` (`198416e`). No test runner or committed tests:
> verification used temporary scripts against the dev deployment, then all
> fixture data and scripts were deleted per the user's request.

## Phase 4: Docs + polish

**User stories**: 5

### Step 7: "Use with your AI agent" documentation

Add an `llms.txt`-style snippet page or section in settings with copy-paste configs for Claude Code (`claude mcp add`), Claude Desktop JSON, and generic streamable-HTTP MCP clients pointing at `<deployment>/api/mcp`.

#### Acceptance criteria

- [x] Copy-paste snippets added in settings for Claude Code, Claude Desktop and generic streamable-HTTP clients (`src/components/settings/mcp-setup-section.tsx`), using the HTTP actions URL (`<site>/api/mcp`) and the `Authorization: Bearer <token>` header; the site URL comes from `VITE_CONVEX_SITE_URL`, or is derived from `VITE_CONVEX_URL` when that variable isn't set (deployments)
- [x] Connection path verified with a real MCP SDK client (`StreamableHTTPClientTransport`) connecting to the documented dev URL and listing all six tools; end-user Claude Desktop setup timing was not measured
- [x] README.md ToDo updated with the completed MCP item

### Step 8: Deployment checks

- [x] `bun run build` passes; `npx convex dev` typegen clean; eslint clean (0 errors).
- [x] Real MCP client end-to-end against the dev deployment: `initialize`, `tools/list` (six tools), group + line-item reads, and idempotent `register_expense`. All temporary fixtures, tokens and scripts were removed afterwards; no test files committed.
- [ ] Manual test against production deployment URL once deployed (CORS not needed for server-to-server/stdio clients; verify direct POST works from Inspector). Pending: no production URL was provided.

## Phase 5: Earnings tools

### Step 9: Internal earnings functions

`convex/earnings.ts`: extract create/update validation into shared helpers used
by both UI mutations and new internal mutations taking an explicit `userId`.
Add `getEarningsInternal` (optional inclusive date range + limit, resolved
wallet name and bucket allocations) and `getEarningInternal` (id + ownership).

#### Acceptance criteria

- [x] UI and MCP writes share validation and balance/allocation logic
- [x] Internal reads and writes only touch the token owner's earnings

### Step 10: `list_earnings` read tool

`list_earnings(dateFrom?, dateTo?, limit?)` → latest first, decimal currency
values, resolved wallet name and each allocation's bucket, percentage and
value. Same date validation as `list_expenses`.

#### Acceptance criteria

- [x] Tool returns decimal currency only, with calendar-validated dates
- [x] `dateTo` before `dateFrom` is rejected

### Step 11: `register_earning` and `update_earning` write tools

`register_earning(title, value, date, wallet, description?, source?)` resolves
the wallet by name (case-insensitively, listing valid names on a miss), rejects
non-positive values and delegates to `createEarningInternal`.
`update_earning(id, ...)` changes only supplied fields, uses
`getEarningInternal` for current values and delegates to
`updateEarningInternal` so balances and allocations are recalculated.

#### Acceptance criteria

- [x] Unknown wallet names list valid alternatives
- [x] Positive exact-cent values only; balances and allocations stay consistent
- [x] Partial updates preserve unspecified fields

### Step 12: Docs and settings copy

Update README ToDo, settings MCP copy, PRD and this plan.

#### Acceptance criteria

- [x] Settings text describes earnings reads and writes

> Status: Steps 9–12 implemented. Static checks pass; live end-to-end MCP
> verification for earnings remains pending (Phase 4 covered expenses only).
> Tool count is now ten (seven original + three earnings tools).

---

## Unresolved questions

a) ~~Should write actions beyond expenses (earnings, movements) join v1?~~ **Resolved: expenses-only for v1; earnings added in Phase 5.**
b) ~~Read-only token scope in v1?~~ **Resolved: no scopes; single-user app, all tokens read-write.**
c) ~~Token expiry?~~ **Resolved: valid until revoked.**
