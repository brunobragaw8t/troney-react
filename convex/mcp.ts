import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { ConvexError } from "convex/values";
import z from "zod";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { httpAction } from "./_generated/server";
import { hashToken, TOKEN_PREFIX } from "./mcp_tokens";

const SERVER_NAME = "troney";
const SERVER_VERSION = "0.1.0";
const MAX_DATE = "9999-12-31";
const BEARER_HEADER_RE = /^Bearer\s+(\S+)$/i;

// Tools accept and return decimal currency values (32.5 means 32.50);
// storage is integer cents, so conversion happens only at this boundary.
const centsToDecimal = (cents: number) => cents / 100;

const DECIMAL_CENTS_RE = /^(-?)(\d+)(?:\.(\d{1,2}))?$/;

function toCents(value: number): number | null {
  if (!Number.isFinite(value)) return null;

  const match = DECIMAL_CENTS_RE.exec(value.toString());
  if (!match) return null;

  const magnitude =
    Number(match[2]) * 100 + Number((match[3] ?? "").padEnd(2, "0"));
  const cents = match[1] === "-" ? -magnitude : magnitude;

  return Number.isSafeInteger(cents) ? cents : null;
}

function hasExactCents(value: number): boolean {
  return toCents(value) !== null;
}

function decimalToCents(value: number): number {
  const cents = toCents(value);

  if (cents === null) {
    throw new ConvexError(
      "Amount must be a non-zero number with at most 2 decimal places (e.g. 32.5)",
    );
  }

  return cents;
}

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00Z`);

  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

function nextDay(date: string): string {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);

  return next.toISOString().slice(0, 10);
}

function findByName<T extends { name: string }>(
  items: T[],
  wanted: string,
): T | null {
  return (
    items.find((item) => item.name.toLowerCase() === wanted.toLowerCase()) ??
    null
  );
}

function unknownMessage(
  kind: string,
  wanted: string,
  items: { name: string }[],
) {
  return `Unknown ${kind} "${wanted}". Valid ${kind}s: ${items
    .map((item) => item.name)
    .join(", ")}`;
}

const dateSchema = z
  .string()
  .refine(isCalendarDate, "Date must be a valid YYYY-MM-DD date");

const moneySchema = z
  .number()
  .refine((value) => value !== 0, "Amount must not be zero")
  .refine(
    hasExactCents,
    "Amount must have at most 2 decimal places (e.g. 32.5)",
  )
  .meta({
    description:
      "Non-zero amount in decimal currency (e.g. 32.5). Negative values register a refund, which increases the wallet and bucket balances",
  });

const positiveMoneySchema = z
  .number()
  .refine(
    hasExactCents,
    "Amount must have at most 2 decimal places (e.g. 32.5)",
  )
  .refine((value) => value > 0, "Amount must be greater than zero")
  .meta({
    description: "Positive amount in decimal currency (e.g. 32.5)",
  });

interface McpTool extends Tool {
  call: (rawArgs: unknown) => Promise<unknown>;
}

function defineTool<Args>(tool: {
  name: string;
  description: string;
  args: z.ZodType<Args>;
  handler: (args: Args) => Promise<unknown>;
}): McpTool {
  return {
    name: tool.name,
    description: tool.description,
    inputSchema: z.toJSONSchema(tool.args) as Tool["inputSchema"],
    call: async (rawArgs) => {
      const parsed = tool.args.safeParse(rawArgs ?? {});

      if (!parsed.success) {
        throw new McpError(
          ErrorCode.InvalidParams,
          parsed.error.issues
            .map(
              (issue) =>
                `${issue.path.join(".") || "arguments"}: ${issue.message}`,
            )
            .join("; "),
        );
      }

      return tool.handler(parsed.data);
    },
  };
}

export const mcpHandler = httpAction(async (ctx, request) => {
  // GET would open a long-lived SSE stream and DELETE would be answered with
  // 200 by the stateless transport; neither belongs in a Convex httpAction.
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", Allow: "POST" },
    });
  }

  const unauthorized = () =>
    new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "WWW-Authenticate": "Bearer",
      },
    });

  const bearer = BEARER_HEADER_RE.exec(
    request.headers.get("Authorization") ?? "",
  );
  if (!bearer || !bearer[1].startsWith(TOKEN_PREFIX)) return unauthorized();

  const tokenHash = await hashToken(bearer[1]);
  const matched = await ctx.runQuery(internal.mcp_tokens.getUserIdByToken, {
    tokenHash,
  });

  if (!matched) return unauthorized();

  await ctx.runMutation(internal.mcp_tokens.touchLastUsed, {
    id: matched.tokenId,
  });

  const userId = matched.userId;

  const tools: McpTool[] = [
    defineTool({
      name: "list_wallets",
      description:
        "List the user's wallets with their current balances. Balances are decimal currency (32.5 means 32.50).",
      args: z.object({}),
      handler: async () => {
        const wallets = await ctx.runQuery(
          internal.wallets.getWalletsInternal,
          { userId },
        );

        return wallets.map((wallet) => ({
          name: wallet.name,
          balance: centsToDecimal(wallet.balance),
        }));
      },
    }),
    defineTool({
      name: "list_buckets",
      description:
        "List the user's buckets with their budget (percentage of income) and current balance. Balances are decimal currency.",
      args: z.object({}),
      handler: async () => {
        const buckets = await ctx.runQuery(
          internal.buckets.getBucketsInternal,
          { userId },
        );

        return buckets.map((bucket) => ({
          name: bucket.name,
          budget: bucket.budget,
          balance: centsToDecimal(bucket.balance),
        }));
      },
    }),
    defineTool({
      name: "list_categories",
      description: "List the user's expense category names.",
      args: z.object({}),
      handler: async () => {
        const categories = await ctx.runQuery(
          internal.categories.getCategoriesInternal,
          { userId },
        );

        return categories.map((category) => ({ name: category.name }));
      },
    }),
    defineTool({
      name: "list_expenses",
      description:
        "List registered expenses in a date range, latest first. Dates are inclusive YYYY-MM-DD strings. Values are decimal currency. Includes individual line items of expense groups: those rows have a non-null groupId identifying the single purchase they belong to. No separate group-total row is returned, so summing the rows gives actual spend.",
      args: z.object({
        dateFrom: dateSchema.meta({
          description: "Start date (YYYY-MM-DD), inclusive",
        }),
        dateTo: dateSchema.optional().meta({
          description: "End date (YYYY-MM-DD), inclusive",
        }),
        limit: z.number().int().min(1).max(100).optional().meta({
          description:
            "Maximum number of expenses to return (default 20, max 100)",
        }),
      }),
      handler: async (args) => {
        if (args.dateTo && args.dateTo < args.dateFrom) {
          throw new ConvexError("dateTo must be on or after dateFrom");
        }

        const dateToExclusive =
          args.dateTo && args.dateTo < MAX_DATE
            ? nextDay(args.dateTo)
            : undefined;

        const expenses = await ctx.runQuery(
          internal.expenses.getExpensesInternal,
          {
            userId,
            dateFrom: args.dateFrom,
            dateToExclusive,
            limit: args.limit ?? 20,
          },
        );

        return expenses.map((expense) => ({
          id: expense._id,
          groupId: expense.groupId ?? null,
          title: expense.title,
          value: centsToDecimal(expense.value),
          date: expense.date,
          wallet: expense.walletName,
          bucket: expense.bucketName,
          category: expense.categoryName,
          description: expense.description,
          source: expense.source,
        }));
      },
    }),
    defineTool({
      name: "list_expense_groups",
      description:
        "List expense groups: single purchases recorded as several line items. Each result has a total and the categories/buckets involved. Values are decimal currency. Use list_expenses and match on groupId to see the individual lines.",
      args: z.object({
        dateFrom: dateSchema.optional().meta({
          description: "Start date (YYYY-MM-DD), inclusive",
        }),
        dateTo: dateSchema.optional().meta({
          description: "End date (YYYY-MM-DD), inclusive",
        }),
        limit: z.number().int().min(1).max(100).optional().meta({
          description:
            "Maximum number of groups to return (default 20, max 100)",
        }),
      }),
      handler: async (args) => {
        if (args.dateTo && args.dateFrom && args.dateTo < args.dateFrom) {
          throw new ConvexError("dateTo must be on or after dateFrom");
        }

        const dateToExclusive =
          args.dateTo && args.dateTo < MAX_DATE
            ? nextDay(args.dateTo)
            : undefined;

        const groups = await ctx.runQuery(
          internal.expense_groups.getExpenseGroupsInternal,
          {
            userId,
            dateFrom: args.dateFrom,
            dateToExclusive,
            limit: args.limit ?? 20,
          },
        );

        return groups.map((group) => ({
          ...group,
          total: centsToDecimal(group.total),
        }));
      },
    }),
    defineTool({
      name: "list_earnings",
      description:
        "List registered earnings (income) in a date range, latest first. Dates are inclusive YYYY-MM-DD strings. Values are decimal currency. Each earning includes its wallet and the bucket allocations created when it was registered.",
      args: z.object({
        dateFrom: dateSchema.optional().meta({
          description: "Start date (YYYY-MM-DD), inclusive",
        }),
        dateTo: dateSchema.optional().meta({
          description: "End date (YYYY-MM-DD), inclusive",
        }),
        limit: z.number().int().min(1).max(100).optional().meta({
          description:
            "Maximum number of earnings to return (default 20, max 100)",
        }),
      }),
      handler: async (args) => {
        if (args.dateTo && args.dateFrom && args.dateTo < args.dateFrom) {
          throw new ConvexError("dateTo must be on or after dateFrom");
        }

        const dateToExclusive =
          args.dateTo && args.dateTo < MAX_DATE
            ? nextDay(args.dateTo)
            : undefined;

        const earnings = await ctx.runQuery(
          internal.earnings.getEarningsInternal,
          {
            userId,
            dateFrom: args.dateFrom,
            dateToExclusive,
            limit: args.limit ?? 20,
          },
        );

        return earnings.map((earning) => ({
          id: earning._id,
          title: earning.title,
          value: centsToDecimal(earning.value),
          date: earning.date,
          wallet: earning.walletName,
          description: earning.description,
          source: earning.source,
          allocations: earning.allocations.map((allocation) => ({
            bucket: allocation.bucket,
            bucketPercentage: allocation.bucketPercentage,
            value: centsToDecimal(allocation.value),
          })),
        }));
      },
    }),
    defineTool({
      name: "register_expense",
      description:
        "Register an expense. Wallet, bucket and category are matched by name, case-insensitively; call the list tools first to get valid names. The expense decreases the wallet and bucket balances; a negative value registers a refund and increases them. Value is decimal currency (32.5 means 32.50).",
      args: z.object({
        title: z
          .string()
          .min(1)
          .max(100)
          .meta({ description: "Short description (max 100 characters)" }),
        value: moneySchema,
        date: dateSchema.meta({ description: "Expense date (YYYY-MM-DD)" }),
        wallet: z.string().min(1).meta({ description: "Wallet name" }),
        bucket: z.string().min(1).meta({ description: "Bucket name" }),
        category: z.string().min(1).meta({ description: "Category name" }),
        description: z.string().max(255).optional().meta({
          description: "Optional longer description (max 255 characters)",
        }),
        source: z.string().max(100).optional().meta({
          description:
            "Optional source, like the store name (max 100 characters)",
        }),
        idempotencyKey: z.string().min(1).max(100).optional().meta({
          description:
            "Optional key (max 100 characters) that makes retries safe: reusing the same key returns the original expense instead of charging again",
        }),
      }),
      handler: async (args) => {
        const [wallets, buckets, categories] = await Promise.all([
          ctx.runQuery(internal.wallets.getWalletsInternal, { userId }),
          ctx.runQuery(internal.buckets.getBucketsInternal, { userId }),
          ctx.runQuery(internal.categories.getCategoriesInternal, { userId }),
        ]);

        const wallet = findByName(wallets, args.wallet);
        if (!wallet) {
          throw new ConvexError(unknownMessage("wallet", args.wallet, wallets));
        }

        const bucket = findByName(buckets, args.bucket);
        if (!bucket) {
          throw new ConvexError(unknownMessage("bucket", args.bucket, buckets));
        }

        const category = findByName(categories, args.category);
        if (!category) {
          throw new ConvexError(
            unknownMessage("category", args.category, categories),
          );
        }

        const expenseId = await ctx.runMutation(
          internal.expenses.createExpenseInternal,
          {
            userId,
            walletId: wallet._id,
            bucketId: bucket._id,
            categoryId: category._id,
            title: args.title,
            description: args.description ?? "",
            value: decimalToCents(args.value),
            source: args.source ?? "",
            date: args.date,
            idempotencyKey: args.idempotencyKey,
          },
        );

        return {
          id: expenseId,
          title: args.title,
          value: args.value,
          date: args.date,
          wallet: wallet.name,
          bucket: bucket.name,
          category: category.name,
          description: args.description ?? "",
          source: args.source ?? "",
        };
      },
    }),
    defineTool({
      name: "update_expense",
      description:
        "Update an existing expense: change its title, value, date, description, source, wallet, bucket or category. Only the provided fields change; wallet, bucket and category are matched by name, case-insensitively. Use list_expenses to find the expense id. Balances are adjusted when the value, wallet or bucket changes.",
      args: z.object({
        id: z
          .string()
          .min(1)
          .meta({ description: "Expense id, as returned by list_expenses" }),
        title: z
          .string()
          .min(1)
          .max(100)
          .optional()
          .meta({ description: "New short description (max 100 characters)" }),
        value: moneySchema.optional().meta({
          description:
            "New non-zero amount in decimal currency (e.g. 32.5); negative for a refund",
        }),
        date: dateSchema.optional().meta({ description: "New expense date" }),
        wallet: z
          .string()
          .min(1)
          .optional()
          .meta({ description: "New wallet name" }),
        bucket: z
          .string()
          .min(1)
          .optional()
          .meta({ description: "New bucket name" }),
        category: z
          .string()
          .min(1)
          .optional()
          .meta({ description: "New category name" }),
        description: z.string().max(255).optional().meta({
          description: "New longer description (max 255 characters)",
        }),
        source: z.string().max(100).optional().meta({
          description: "New source, like the store name (max 100 characters)",
        }),
      }),
      handler: async (args) => {
        const id = args.id as Id<"expenses">;

        const existing = await ctx.runQuery(
          internal.expenses.getExpenseInternal,
          { userId, id },
        );
        if (!existing) {
          throw new ConvexError(`Expense ${args.id} not found`);
        }

        const [wallets, buckets, categories] = await Promise.all([
          ctx.runQuery(internal.wallets.getWalletsInternal, { userId }),
          ctx.runQuery(internal.buckets.getBucketsInternal, { userId }),
          ctx.runQuery(internal.categories.getCategoriesInternal, { userId }),
        ]);

        function pick<T extends { _id: string; name: string }>(
          items: T[],
          wanted: string | undefined,
          currentId: string,
          kind: string,
        ): T {
          if (wanted !== undefined) {
            const found = findByName(items, wanted);

            if (!found)
              throw new ConvexError(unknownMessage(kind, wanted, items));

            return found;
          }

          const current = items.find((item) => item._id === currentId);

          if (!current) throw new ConvexError(`Current ${kind} is missing`);

          return current;
        }

        const wallet = pick(wallets, args.wallet, existing.walletId, "wallet");
        const bucket = pick(buckets, args.bucket, existing.bucketId, "bucket");
        const category = pick(
          categories,
          args.category,
          existing.categoryId,
          "category",
        );

        const value = args.value ?? centsToDecimal(existing.value);

        await ctx.runMutation(internal.expenses.updateExpenseInternal, {
          userId,
          id,
          walletId: wallet._id,
          bucketId: bucket._id,
          categoryId: category._id,
          title: args.title ?? existing.title,
          description: args.description ?? existing.description,
          value: decimalToCents(value),
          source: args.source ?? existing.source,
          date: args.date ?? existing.date,
        });

        return {
          id: args.id,
          title: args.title ?? existing.title,
          value,
          date: args.date ?? existing.date,
          wallet: wallet.name,
          bucket: bucket.name,
          category: category.name,
          description: args.description ?? existing.description,
          source: args.source ?? existing.source,
        };
      },
    }),
    defineTool({
      name: "register_earning",
      description:
        "Register an earning (income). The wallet is matched by name, case-insensitively; call list_wallets first to get valid names. The value must be positive and decimal currency (32.5 means 32.50). It increases the wallet balance and is allocated to your buckets according to their budgets, which must total 100%.",
      args: z.object({
        title: z
          .string()
          .min(1)
          .max(100)
          .meta({ description: "Short description (max 100 characters)" }),
        value: positiveMoneySchema,
        date: dateSchema.meta({ description: "Earning date (YYYY-MM-DD)" }),
        wallet: z.string().min(1).meta({ description: "Wallet name" }),
        description: z.string().max(255).optional().meta({
          description: "Optional longer description (max 255 characters)",
        }),
        source: z.string().max(100).optional().meta({
          description:
            "Optional source, like the employer name (max 100 characters)",
        }),
      }),
      handler: async (args) => {
        const wallets = await ctx.runQuery(
          internal.wallets.getWalletsInternal,
          { userId },
        );

        const wallet = findByName(wallets, args.wallet);
        if (!wallet) {
          throw new ConvexError(unknownMessage("wallet", args.wallet, wallets));
        }

        const earningId = await ctx.runMutation(
          internal.earnings.createEarningInternal,
          {
            userId,
            walletId: wallet._id,
            title: args.title,
            description: args.description ?? "",
            value: decimalToCents(args.value),
            source: args.source ?? "",
            date: args.date,
          },
        );

        return {
          id: earningId,
          title: args.title,
          value: args.value,
          date: args.date,
          wallet: wallet.name,
          description: args.description ?? "",
          source: args.source ?? "",
        };
      },
    }),
    defineTool({
      name: "update_earning",
      description:
        "Update an existing earning: change its title, value, date, description, source or wallet. Only the provided fields change; wallet is matched by name, case-insensitively. Use list_earnings to find the earning id. Wallet balance and bucket allocations are adjusted when the value or wallet changes.",
      args: z.object({
        id: z
          .string()
          .min(1)
          .meta({ description: "Earning id, as returned by list_earnings" }),
        title: z
          .string()
          .min(1)
          .max(100)
          .optional()
          .meta({ description: "New short description (max 100 characters)" }),
        value: positiveMoneySchema.optional().meta({
          description: "New positive amount in decimal currency (e.g. 32.5)",
        }),
        date: dateSchema.optional().meta({ description: "New earning date" }),
        wallet: z
          .string()
          .min(1)
          .optional()
          .meta({ description: "New wallet name" }),
        description: z.string().max(255).optional().meta({
          description: "New longer description (max 255 characters)",
        }),
        source: z.string().max(100).optional().meta({
          description:
            "New source, like the employer name (max 100 characters)",
        }),
      }),
      handler: async (args) => {
        const id = args.id as Id<"earnings">;

        const existing = await ctx.runQuery(
          internal.earnings.getEarningInternal,
          { userId, id },
        );
        if (!existing) {
          throw new ConvexError(`Earning ${args.id} not found`);
        }

        const wallets = await ctx.runQuery(
          internal.wallets.getWalletsInternal,
          { userId },
        );

        let wallet;
        if (args.wallet !== undefined) {
          const found = findByName(wallets, args.wallet);
          if (!found) {
            throw new ConvexError(
              unknownMessage("wallet", args.wallet, wallets),
            );
          }
          wallet = found;
        } else {
          wallet = wallets.find(
            (candidate) => candidate._id === existing.walletId,
          );
          if (!wallet) throw new ConvexError("Current wallet is missing");
        }

        const value = args.value ?? centsToDecimal(existing.value);

        await ctx.runMutation(internal.earnings.updateEarningInternal, {
          userId,
          id,
          walletId: wallet._id,
          title: args.title ?? existing.title,
          description: args.description ?? existing.description,
          value: decimalToCents(value),
          source: args.source ?? existing.source,
          date: args.date ?? existing.date,
        });

        return {
          id: args.id,
          title: args.title ?? existing.title,
          value,
          date: args.date ?? existing.date,
          wallet: wallet.name,
          description: args.description ?? existing.description,
          source: args.source ?? existing.source,
        };
      },
    }),
  ];

  const server = new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    {
      capabilities: { tools: { listChanged: false } },
      instructions:
        "Troney is a personal finance tracker. Use the list_* tools to look up valid wallet, bucket and category names before registering expenses or earnings. Grouped purchases appear in list_expense_groups and as individual line items in list_expenses (non-null groupId). Earnings are allocated to buckets according to their budgets. All money values in tool inputs and outputs are decimal currency numbers (32.5 means 32.50); dates are YYYY-MM-DD strings.",
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, () => ({
    tools: tools.map(({ name, description, inputSchema }) => ({
      name,
      description,
      inputSchema,
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: rawArgs } = request.params;

    const tool = tools.find((candidate) => candidate.name === name);
    if (!tool) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Unknown tool "${name}". Available tools: ${tools
          .map((candidate) => candidate.name)
          .join(", ")}`,
      );
    }

    try {
      const result = await tool.call(rawArgs);

      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    } catch (error) {
      let message = "Something went wrong. Please try again.";

      if (error instanceof ConvexError) {
        message = String(error.data);
      } else if (error instanceof Error) {
        // Covers McpError and other runtime errors.
        message = error.message;
      }

      return {
        content: [{ type: "text" as const, text: message }],
        isError: true,
      };
    }
  });

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  await server.connect(transport);

  return await transport.handleRequest(request);
});
