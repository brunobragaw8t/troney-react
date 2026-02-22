import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";

async function requireAuth(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);

  if (!userId) {
    throw new ConvexError("Not authenticated");
  }

  return userId;
}

export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) return null;

    const categories = await ctx.db
      .query("categories")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    return categories.sort((a, b) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
    );
  },
});

export const getCategory = query({
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const category = await ctx.db.get(args.id);

    if (!category || category.userId !== userId) {
      throw new ConvexError(`Category ${args.id} not found`);
    }

    return category;
  },
});

export const createCategory = mutation({
  args: {
    name: v.string(),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    return await ctx.db.insert("categories", {
      userId,
      name: args.name,
      color: args.color ?? "#3b82f6",
      icon: args.icon,
    });
  },
});

export const updateCategory = mutation({
  args: {
    id: v.id("categories"),
    name: v.string(),
    color: v.string(),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const category = await ctx.db.get(args.id);

    if (!category || category.userId !== userId) {
      throw new ConvexError(`Category ${args.id} not found`);
    }

    await ctx.db.patch(args.id, {
      name: args.name,
      color: args.color,
      icon: args.icon,
    });

    return await ctx.db.get(args.id);
  },
});

export const deleteCategory = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const category = await ctx.db.get(args.id);

    if (!category || category.userId !== userId) {
      throw new ConvexError(`Category ${args.id} not found`);
    }

    await ctx.db.delete(args.id);

    return category;
  },
});
