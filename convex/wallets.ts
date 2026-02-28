import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./auth";

export const DEFAULT_WALLETS = [
  { name: "Bank", balance: 0 },
  { name: "Cash", balance: 0 },
] as const;

export const getWallets = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) return null;

    const wallets = await ctx.db
      .query("wallets")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    return wallets.sort((a, b) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
    );
  },
});

export const getWallet = query({
  args: { id: v.id("wallets") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const wallet = await ctx.db.get(args.id);

    if (!wallet || wallet.userId !== userId) {
      throw new ConvexError(`Wallet ${args.id} not found`);
    }

    return wallet;
  },
});

export const createWallet = mutation({
  args: {
    name: v.string(),
    balance: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const name = args.name.trim();
    const balance = args.balance ?? 0;

    if (name.length < 1) {
      throw new ConvexError("Name is required");
    }
    if (name.length > 255) {
      throw new ConvexError("Name must be 255 characters or less");
    }
    if (balance < 0) {
      throw new ConvexError("Balance must be 0 or greater");
    }

    return await ctx.db.insert("wallets", {
      userId,
      name,
      balance,
    });
  },
});

export const updateWallet = mutation({
  args: {
    id: v.id("wallets"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const wallet = await ctx.db.get(args.id);

    if (!wallet || wallet.userId !== userId) {
      throw new ConvexError(`Wallet ${args.id} not found`);
    }

    const name = args.name.trim();

    if (name.length < 1) {
      throw new ConvexError("Name is required");
    }
    if (name.length > 255) {
      throw new ConvexError("Name must be 255 characters or less");
    }

    await ctx.db.patch(args.id, { name });

    return await ctx.db.get(args.id);
  },
});

export const deleteWallet = mutation({
  args: { id: v.id("wallets") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const wallet = await ctx.db.get(args.id);

    if (!wallet || wallet.userId !== userId) {
      throw new ConvexError(`Wallet ${args.id} not found`);
    }

    await ctx.db.delete(args.id);

    return wallet;
  },
});
