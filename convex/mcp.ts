import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { ConvexError } from "convex/values";
import z from "zod";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { hashToken, TOKEN_PREFIX } from "./mcp_tokens";

const SERVER_NAME = "troney";
const SERVER_VERSION = "0.1.0";

// Tools accept and return decimal currency values (32.5 means 32.50);
// storage is integer cents, so conversion happens only at this boundary.
const centsToDecimal = (cents: number) => cents / 100;
const decimalToCents = (value: number) => Math.round(value * 100);

const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

interface JsonSchemaProperty {
  type: "string" | "number" | "integer";
  description?: string;
}

interface JsonSchemaObject {
  type: "object";
  properties: Record<string, JsonSchemaProperty>;
  required?: string[];
  additionalProperties: false;
}

interface McpTool {
  name: string;
  description: string;
  inputSchema: JsonSchemaObject;
  call: (rawArgs: unknown) => Promise<unknown>;
}

function defineTool<Args>(tool: {
  name: string;
  description: string;
  inputSchema: JsonSchemaObject;
  args: z.ZodType<Args>;
  handler: (args: Args) => Promise<unknown>;
}): McpTool {
  return {
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
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

function nextDay(date: string) {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);

  return next.toISOString().slice(0, 10);
}

export const mcpHandler = httpAction(async (ctx, request) => {
  const unauthorized = () =>
    new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "WWW-Authenticate": "Bearer",
      },
    });

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith(`Bearer ${TOKEN_PREFIX}`)) {
    return unauthorized();
  }

  const token = authorization.slice("Bearer ".length).trim();
  const tokenHash = await hashToken(token);

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
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      args: z.object({}),
      handler: async () => {
        const wallets = await ctx.runQuery(
          internal.wallets.getWalletsInternal,
          {
            userId,
          },
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
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      args: z.object({}),
      handler: async () => {
        const buckets = await ctx.runQuery(
          internal.buckets.getBucketsInternal,
          {
            userId,
          },
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
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
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
        "List registered expenses in a date range, latest first. Dates are inclusive YYYY-MM-DD strings. Values are decimal currency.",
      inputSchema: {
        type: "object",
        properties: {
          dateFrom: {
            type: "string",
            description: "Start date (YYYY-MM-DD), inclusive",
          },
          dateTo: {
            type: "string",
            description: "End date (YYYY-MM-DD), inclusive",
          },
          limit: {
            type: "integer",
            description:
              "Maximum number of expenses to return (default 20, max 100)",
          },
        },
        required: ["dateFrom"],
        additionalProperties: false,
      },
      args: z.object({
        dateFrom: dateStringSchema,
        dateTo: dateStringSchema.optional(),
        limit: z.number().int().min(1).max(100).optional(),
      }),
      handler: async (args) => {
        if (args.dateTo && args.dateTo < args.dateFrom) {
          throw new ConvexError("dateTo must be on or after dateFrom");
        }

        const expenses: Array<{
          _id: string;
          title: string;
          value: number;
          date: string;
          description: string;
          source: string;
          walletName: string;
          bucketName: string;
          categoryName: string;
        }> = await ctx.runQuery(internal.expenses.getExpensesInternal, {
          userId,
          dateFrom: args.dateFrom,
          dateToExclusive: args.dateTo ? nextDay(args.dateTo) : "9999-12-31",
          limit: args.limit ?? 20,
        });

        return expenses.map((expense) => ({
          id: expense._id,
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
      name: "register_expense",
      description:
        "Register an expense. Wallet, bucket and category are matched by name, case-insensitively; call the list tools first to get valid names. The expense decreases the wallet and bucket balances. Value is decimal currency (32.5 means 32.50).",
      inputSchema: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Short description (max 100 characters)",
          },
          value: {
            type: "number",
            description: "Positive amount in decimal currency (e.g. 32.5)",
          },
          date: { type: "string", description: "Expense date (YYYY-MM-DD)" },
          wallet: { type: "string", description: "Wallet name" },
          bucket: { type: "string", description: "Bucket name" },
          category: { type: "string", description: "Category name" },
          description: {
            type: "string",
            description: "Optional longer description (max 255 characters)",
          },
          source: {
            type: "string",
            description:
              "Optional source, like the store name (max 100 characters)",
          },
        },
        required: ["title", "value", "date", "wallet", "bucket", "category"],
        additionalProperties: false,
      },
      args: z.object({
        title: z.string().min(1),
        value: z.number().positive(),
        date: dateStringSchema,
        wallet: z.string().min(1),
        bucket: z.string().min(1),
        category: z.string().min(1),
        description: z.string().optional(),
        source: z.string().optional(),
      }),
      handler: async (args) => {
        const [wallets, buckets, categories] = await Promise.all([
          ctx.runQuery(internal.wallets.getWalletsInternal, { userId }),
          ctx.runQuery(internal.buckets.getBucketsInternal, { userId }),
          ctx.runQuery(internal.categories.getCategoriesInternal, { userId }),
        ]);

        function findByName<T extends { name: string }>(
          items: T[],
          wanted: string,
        ): T | null {
          return (
            items.find(
              (item) => item.name.toLowerCase() === wanted.toLowerCase(),
            ) ?? null
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

        await ctx.runMutation(internal.expenses.createExpenseInternal, {
          userId,
          walletId: wallet._id,
          bucketId: bucket._id,
          categoryId: category._id,
          title: args.title,
          description: args.description ?? "",
          value: decimalToCents(args.value),
          source: args.source ?? "",
          date: args.date,
        });

        return {
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
  ];

  const server = new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    {
      capabilities: { tools: { listChanged: false } },
      instructions:
        "Troney is a personal expense tracker. Use the list_* tools to look up valid wallet, bucket and category names before registering expenses. All money values in tool inputs and outputs are decimal currency numbers (32.5 means 32.50); dates are YYYY-MM-DD strings.",
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
        message = error.data as string;
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
