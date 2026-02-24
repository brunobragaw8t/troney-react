import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./auth";

export const getBuckets = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) return null;

    const buckets = await ctx.db
      .query("buckets")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    return buckets.sort((a, b) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
    );
  },
});

export const getBucket = query({
  args: { id: v.id("buckets") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const bucket = await ctx.db.get(args.id);

    if (!bucket || bucket.userId !== userId) {
      throw new ConvexError(`Bucket ${args.id} not found`);
    }

    return bucket;
  },
});

export const createBucket = mutation({
  args: {
    name: v.string(),
    budget: v.optional(v.number()),
    balance: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const name = args.name.trim();
    const budget = args.budget ?? 0;
    const balance = args.balance ?? 0;

    if (name.length < 1) {
      throw new ConvexError("Name is required");
    }
    if (name.length > 255) {
      throw new ConvexError("Name must be 255 characters or less");
    }
    if (budget < 0 || budget > 100) {
      throw new ConvexError("Budget must be between 0 and 100");
    }
    if (balance < 0) {
      throw new ConvexError("Balance must be 0 or greater");
    }

    return await ctx.db.insert("buckets", {
      userId,
      name,
      budget,
      balance,
    });
  },
});

export const updateBucket = mutation({
  args: {
    id: v.id("buckets"),
    name: v.string(),
    budget: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const bucket = await ctx.db.get(args.id);

    if (!bucket || bucket.userId !== userId) {
      throw new ConvexError(`Bucket ${args.id} not found`);
    }

    const name = args.name.trim();

    if (name.length < 1) {
      throw new ConvexError("Name is required");
    }
    if (name.length > 255) {
      throw new ConvexError("Name must be 255 characters or less");
    }
    if (args.budget < 0 || args.budget > 100) {
      throw new ConvexError("Budget must be between 0 and 100");
    }

    await ctx.db.patch(args.id, {
      name,
      budget: args.budget,
    });

    return await ctx.db.get(args.id);
  },
});

export const deleteBucket = mutation({
  args: { id: v.id("buckets") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const bucket = await ctx.db.get(args.id);

    if (!bucket || bucket.userId !== userId) {
      throw new ConvexError(`Bucket ${args.id} not found`);
    }

    await ctx.db.delete(args.id);

    return bucket;
  },
});
