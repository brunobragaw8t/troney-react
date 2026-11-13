# Plan: MCP Server

> Source PRD: `prds/mcp-server.md`

## Architectural decisions

- **Library:** `@modelcontextprotocol/sdk` (new dependency, install via `bun add @modelcontextprotocol/sdk`)
- **Endpoint:** Convex `httpAction` mounted in `convex/http.ts` at `/api/mcp` (POST + DELETE)
- **Transport:** stateless `StreamableHTTPServerTransport` with `enableJsonResponse: true`; each POST is self-contained, no long-lived SSE (compatible with Convex httpAction request/response model)
- **Auth:** `Authorization: Bearer <token>`; token hashed with SHA-256, looked up in new `mcpTokens` table; token resolution via `ctx.runQuery` on an internal query
- **Data access:** tool handlers call `ctx.runQuery`/`ctx.runMutation` on **internal** functions that accept explicit `userId`; no reliance on convex-auth session cookies
- **Name resolution:** `register_expense` resolves wallet/bucket/category by exact (case-insensitive) name; on miss, throws a `ConvexError` listing valid names
- **Money:** tools accept and return decimal currency values (e.g. `32.5`); conversion to integer cents (`Math.round(value * 100)`) is an internal storage detail that never leaks into tool inputs or outputs
- **Dates:** `YYYY-MM-DD` strings, validated format, matching existing storage convention
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

Create `McpServer` with name `troney` and version; wrap with stateless `StreamableHTTPServerTransport`. Export a `convex/http.ts` httpAction `POST /api/mcp` that:

1. Parses the `Authorization: Bearer` header; 401 JSON error if missing/invalid.
2. Instantiates a fresh `McpServer` + transport per request (stateless pattern).
3. Connects, handles the JSON-RPC message via `transport.handleRequest`, returns the JSON response with `Mcp-Session-Id` omitted (stateless) and correct `Content-Type`.
4. DELETE returns 405; session-based reconnects are unsupported by design.

Auth context (userId) passed into tool handlers via closure.

#### Acceptance criteria

- [ ] MCP Inspector (`npx @modelcontextprotocol/inspector`) can connect with a token and list tools
- [ ] Invalid token returns 401 with a clear message
- [ ] No session state shared between requests

### Step 5: Read tools

Register tools with Zod schemas and plain-text-for-clients descriptions:

- `list_wallets()` → `{ name, balance }[]`
- `list_buckets()` → `{ name, budget, balance }[]`
- `list_categories()` → `{ name }[]`
- `list_expenses(dateFrom, dateTo?, limit?)` → latest first, `{ title, value, date, wallet, bucket, category, description, source }`

All query the user's own rows only.

#### Acceptance criteria

- [ ] Every tool accepts and returns decimal currency values (e.g. `32.5`), documented in tool descriptions; cents never appear in tool inputs or outputs
- [ ] `dateFrom > dateTo` or malformed dates return a validation error

## Phase 3: Write tool

**User stories**: 3

### Step 6: `register_expense` tool

Args: `title` (1–100 chars), `value` (positive number, decimal currency), `date` (`YYYY-MM-DD`), `wallet`, `bucket`, `category`, `description?` (≤255), `source?`.

Handler: resolve each name case-insensitively against the user's
wallets/buckets/categories; on any miss, error listing valid names. Convert
`value` to cents (`Math.round(value * 100)`). Reuse `createExpense` validation
by extracting shared logic into an internal mutation `createExpenseInternal`
in `convex/expenses.ts` taking explicit `userId`.

#### Acceptance criteria

- [ ] "Register a 32.50 dinner expense in Nubank wallet, Food bucket, Groceries category" succeeds end-to-end via MCP Inspector
- [ ] Unknown name error lists valid alternatives; agent self-corrects in one retry
- [ ] Validation errors match the UI mutation (title length, description length)
- [ ] Result visible in the app UI without refresh

## Phase 4: Docs + polish

**User stories**: 5

### Step 7: "Use with your AI agent" documentation

Add an `llms.txt`-style snippet page or section in settings with copy-paste configs for Claude Code (`claude mcp add`), Claude Desktop JSON, and generic streamable-HTTP MCP clients pointing at `<deployment>/api/mcp`.

#### Acceptance criteria

- [ ] A user can connect Claude Desktop in under 2 minutes following the snippet
- [ ] README.md ToDo updated with the completed MCP item

### Step 8: Deployment checks

- `bun run build` passes; `npx convex dev` typegen clean; eslint clean.
- Manual test against production deployment URL once deployed (CORS not needed for server-to-server/stdio clients; verify direct POST works from Inspector).

---

## Unresolved questions

a) ~~Should write actions beyond expenses (earnings, movements) join v1?~~ **Resolved: expenses-only for v1.**
b) ~~Read-only token scope in v1?~~ **Resolved: no scopes; single-user app, all tokens read-write.**
c) ~~Token expiry?~~ **Resolved: valid until revoked.**
