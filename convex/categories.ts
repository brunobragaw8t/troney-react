import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./auth";

export const DEFAULT_CATEGORIES = [
  { name: "Food", icon: "🥗", color: "#10b981" },
  { name: "Transport", icon: "🚗", color: "#3b82f6" },
  { name: "Entertainment", icon: "🍿", color: "#f59e0b" },
  { name: "Clothing", icon: "👕", color: "#8b5cf6" },
  { name: "Hygiene", icon: "🧴", color: "#06b6d4" },
  { name: "Health", icon: "🩺", color: "#ef4444" },
  { name: "Education", icon: "🎓", color: "#6366f1" },
  { name: "Bills", icon: "🧾", color: "#64748b" },
  { name: "House", icon: "🏠", color: "#d97706" },
  { name: "Investments", icon: "📈", color: "#059669" },
  { name: "Other", icon: "❓", color: "#6b7280" },
] as const;

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
