import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./auth";

export const getEarnings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) return null;

    const earnings = await ctx.db
      .query("earnings")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const earningsWithWallet = await Promise.all(
      earnings.map(async (earning) => {
        const wallet = await ctx.db.get(earning.walletId);
        return {
          ...earning,
          walletName: wallet?.name ?? "No wallet",
        };
      }),
    );

    return earningsWithWallet.sort((a, b) => b.date.localeCompare(a.date));
  },
});

export const getEarning = query({
  args: { id: v.id("earnings") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const earning = await ctx.db.get(args.id);

    if (!earning || earning.userId !== userId) {
      throw new ConvexError(`Earning ${args.id} not found`);
    }

    return earning;
  },
});

export const createEarning = mutation({
  args: {
    walletId: v.id("wallets"),
    title: v.string(),
    description: v.string(),
    value: v.number(),
    source: v.string(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const title = args.title.trim();
    if (title.length < 1) throw new ConvexError("Title is required");
    if (title.length > 100)
      throw new ConvexError("Title must be 100 characters or less");

    const description = args.description.trim();
    if (description.length > 255)
      throw new ConvexError("Description must be 255 characters or less");

    if (args.value <= 0) throw new ConvexError("Value must be greater than 0");

    const source = args.source.trim();
    if (source.length > 100)
      throw new ConvexError("Source must be 100 characters or less");

    const wallet = await ctx.db.get(args.walletId);
    if (!wallet || wallet.userId !== userId) {
      throw new ConvexError("Please select a valid wallet");
    }

    const buckets = await ctx.db
      .query("buckets")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    if (buckets.length === 0) {
      throw new ConvexError(
        "You must have at least one bucket before creating an earning",
      );
    }

    const totalBudget = buckets.reduce((sum, b) => sum + b.budget, 0);
    if (totalBudget !== 100) {
      throw new ConvexError("Total bucket budget percentage must be 100");
    }

    const earningId = await ctx.db.insert("earnings", {
      userId,
      walletId: args.walletId,
      title,
      description,
      value: args.value,
      source,
      date: args.date,
    });

    await ctx.db.patch(args.walletId, {
      balance: wallet.balance + args.value,
    });

    await Promise.all(
      buckets.map(async (bucket) => {
        const allocationValue = Math.round((args.value * bucket.budget) / 100);

        await ctx.db.insert("earningAllocations", {
          earningId,
          bucketId: bucket._id,
          value: allocationValue,
          bucketPercentage: bucket.budget,
        });

        await ctx.db.patch(bucket._id, {
          balance: bucket.balance + allocationValue,
        });
      }),
    );

    return earningId;
  },
});

export const updateEarning = mutation({
  args: {
    id: v.id("earnings"),
    walletId: v.id("wallets"),
    title: v.string(),
    description: v.string(),
    value: v.number(),
    source: v.string(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const title = args.title.trim();
    if (title.length < 1) throw new ConvexError("Title is required");
    if (title.length > 100)
      throw new ConvexError("Title must be 100 characters or less");

    const description = args.description.trim();
    if (description.length > 255)
      throw new ConvexError("Description must be 255 characters or less");

    if (args.value <= 0) throw new ConvexError("Value must be greater than 0");

    const source = args.source.trim();
    if (source.length > 100)
      throw new ConvexError("Source must be 100 characters or less");

    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== userId) {
      throw new ConvexError(`Earning ${args.id} not found`);
    }

    const wallet = await ctx.db.get(args.walletId);
    if (!wallet || wallet.userId !== userId) {
      throw new ConvexError("Please select a valid wallet");
    }

    if (existing.walletId !== args.walletId) {
      // Wallet changed: remove from old, add to new
      const oldWallet = await ctx.db.get(existing.walletId);
      if (oldWallet) {
        await ctx.db.patch(existing.walletId, {
          balance: oldWallet.balance - existing.value,
        });
      }
      await ctx.db.patch(args.walletId, {
        balance: wallet.balance + args.value,
      });
    } else {
      // Same wallet: adjust by difference
      const diff = args.value - existing.value;
      await ctx.db.patch(args.walletId, {
        balance: wallet.balance + diff,
      });
    }

    const allocations = await ctx.db
      .query("earningAllocations")
      .withIndex("by_earningId", (q) => q.eq("earningId", args.id))
      .collect();

    // Subtract old allocation values from buckets
    for (const alloc of allocations) {
      if (!alloc.bucketId) continue;
      const bucket = await ctx.db.get(alloc.bucketId);
      if (bucket) {
        await ctx.db.patch(alloc.bucketId, {
          balance: bucket.balance - alloc.value,
        });
      }
    }

    await ctx.db.patch(args.id, {
      walletId: args.walletId,
      title,
      description,
      value: args.value,
      source,
      date: args.date,
    });

    // Recalculate allocations with new value but original bucket percentages
    for (const alloc of allocations) {
      if (!alloc.bucketId) continue;
      const bucket = await ctx.db.get(alloc.bucketId);
      if (!bucket) continue;

      const newAllocationValue = Math.round(
        (args.value * alloc.bucketPercentage) / 100,
      );

      await ctx.db.patch(alloc._id, { value: newAllocationValue });
      await ctx.db.patch(alloc.bucketId, {
        balance: bucket.balance + newAllocationValue,
      });
    }

    return args.id;
  },
});

export const deleteEarning = mutation({
  args: { id: v.id("earnings") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const earning = await ctx.db.get(args.id);
    if (!earning || earning.userId !== userId) {
      throw new ConvexError(`Earning ${args.id} not found`);
    }

    const wallet = await ctx.db.get(earning.walletId);
    if (wallet) {
      await ctx.db.patch(earning.walletId, {
        balance: wallet.balance - earning.value,
      });
    }

    const allocations = await ctx.db
      .query("earningAllocations")
      .withIndex("by_earningId", (q) => q.eq("earningId", args.id))
      .collect();

    for (const alloc of allocations) {
      if (alloc.bucketId) {
        const bucket = await ctx.db.get(alloc.bucketId);
        if (bucket) {
          await ctx.db.patch(alloc.bucketId, {
            balance: bucket.balance - alloc.value,
          });
        }
      }
      await ctx.db.delete(alloc._id);
    }

    await ctx.db.delete(args.id);

    return earning;
  },
});
