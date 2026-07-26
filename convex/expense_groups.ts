import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./auth";

export const getExpenseGroups = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (!userId)
      return { page: [], isDone: true, continueCursor: "", splitCursor: null };

    const results = await ctx.db
      .query("expenseGroups")
      .withIndex("by_userId_date", (q) => q.eq("userId", userId))
      .order("desc")
      .paginate(args.paginationOpts);

    const page = await Promise.all(
      results.page.map(async (group) => {
        const wallet = await ctx.db.get(group.walletId);

        const items = await ctx.db
          .query("expenses")
          .withIndex("by_groupId", (q) => q.eq("groupId", group._id))
          .collect();

        const totalValue = items.reduce((sum, item) => sum + item.value, 0);

        return {
          ...group,
          walletName: wallet?.name ?? "No wallet",
          itemCount: items.length,
          totalValue,
        };
      }),
    );

    return { ...results, page };
  },
});

export const getAllExpenseGroups = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) return [];

    const groups = await ctx.db
      .query("expenseGroups")
      .withIndex("by_userId_date", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return Promise.all(
      groups.map(async (group) => {
        const wallet = await ctx.db.get(group.walletId);

        const items = await ctx.db
          .query("expenses")
          .withIndex("by_groupId", (q) => q.eq("groupId", group._id))
          .collect();

        const totalValue = items.reduce((sum, item) => sum + item.value, 0);

        const categoryNames = [
          ...new Set(
            await Promise.all(
              items.map(async (item) => {
                const cat = await ctx.db.get(item.categoryId);
                return cat?.name ?? "No category";
              }),
            ),
          ),
        ];

        const bucketNames = [
          ...new Set(
            await Promise.all(
              items.map(async (item) => {
                const bucket = await ctx.db.get(item.bucketId);
                return bucket?.name ?? "No bucket";
              }),
            ),
          ),
        ];

        return {
          _id: group._id,
          _creationTime: group._creationTime,
          type: "expense_group" as const,
          title: `${items.length} items`,
          value: totalValue,
          source: group.source,
          categoryName: categoryNames.join(", "),
          bucketName: bucketNames.join(", "),
          walletName: wallet?.name ?? "No wallet",
          date: group.date,
        };
      }),
    );
  },
});

export const getExpenseGroup = query({
  args: { id: v.id("expenseGroups") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const group = await ctx.db.get(args.id);

    if (!group || group.userId !== userId) {
      throw new ConvexError(`Expense group ${args.id} not found`);
    }

    return group;
  },
});

export const getExpenseGroupItems = query({
  args: { groupId: v.id("expenseGroups") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const group = await ctx.db.get(args.groupId);
    if (!group || group.userId !== userId) {
      throw new ConvexError(`Expense group ${args.groupId} not found`);
    }

    const items = await ctx.db
      .query("expenses")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
      .collect();

    const enriched = await Promise.all(
      items.map(async (item) => {
        const [bucket, category] = await Promise.all([
          ctx.db.get(item.bucketId),
          ctx.db.get(item.categoryId),
        ]);

        return {
          ...item,
          bucketName: bucket?.name ?? "No bucket",
          categoryName: category?.name ?? "No category",
        };
      }),
    );

    return enriched;
  },
});

const expenseGroupItemValidator = v.object({
  bucketId: v.id("buckets"),
  categoryId: v.id("categories"),
  title: v.string(),
  value: v.number(),
  description: v.optional(v.string()),
});

export const createExpenseGroup = mutation({
  args: {
    walletId: v.id("wallets"),
    date: v.string(),
    source: v.string(),
    description: v.optional(v.string()),
    items: v.array(expenseGroupItemValidator),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const source = args.source.trim();
    if (source.length > 100)
      throw new ConvexError("Source must be 100 characters or less");

    if (args.items.length < 1)
      throw new ConvexError("At least one item is required");

    const wallet = await ctx.db.get(args.walletId);
    if (!wallet || wallet.userId !== userId) {
      throw new ConvexError("Please select a valid wallet");
    }

    for (const item of args.items) {
      const title = item.title.trim();
      if (title.length < 1) throw new ConvexError("Item title is required");
      if (title.length > 100)
        throw new ConvexError("Item title must be 100 characters or less");

      const bucket = await ctx.db.get(item.bucketId);
      if (!bucket || bucket.userId !== userId) {
        throw new ConvexError("Please select a valid bucket");
      }

      const category = await ctx.db.get(item.categoryId);
      if (!category || category.userId !== userId) {
        throw new ConvexError("Please select a valid category");
      }
    }

    const description = args.description?.trim();
    if (description && description.length > 255)
      throw new ConvexError("Description must be 255 characters or less");

    const groupId = await ctx.db.insert("expenseGroups", {
      userId,
      walletId: args.walletId,
      date: args.date,
      source,
      description: description || undefined,
    });

    const totalValue = args.items.reduce((sum, item) => sum + item.value, 0);

    for (const item of args.items) {
      await ctx.db.insert("expenses", {
        userId,
        walletId: args.walletId,
        bucketId: item.bucketId,
        categoryId: item.categoryId,
        groupId,
        title: item.title.trim(),
        description: item.description?.trim() || "",
        value: item.value,
        source,
        date: args.date,
      });

      const bucket = await ctx.db.get(item.bucketId);
      if (bucket) {
        await ctx.db.patch(item.bucketId, {
          balance: bucket.balance - item.value,
        });
      }
    }

    await ctx.db.patch(args.walletId, {
      balance: wallet.balance - totalValue,
    });

    return groupId;
  },
});

export const updateExpenseGroup = mutation({
  args: {
    id: v.id("expenseGroups"),
    walletId: v.id("wallets"),
    date: v.string(),
    source: v.string(),
    description: v.optional(v.string()),
    items: v.array(expenseGroupItemValidator),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const source = args.source.trim();
    if (source.length > 100)
      throw new ConvexError("Source must be 100 characters or less");

    if (args.items.length < 1)
      throw new ConvexError("At least one item is required");

    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== userId) {
      throw new ConvexError(`Expense group ${args.id} not found`);
    }

    const wallet = await ctx.db.get(args.walletId);
    if (!wallet || wallet.userId !== userId) {
      throw new ConvexError("Please select a valid wallet");
    }

    for (const item of args.items) {
      const title = item.title.trim();
      if (title.length < 1) throw new ConvexError("Item title is required");
      if (title.length > 100)
        throw new ConvexError("Item title must be 100 characters or less");

      const bucket = await ctx.db.get(item.bucketId);
      if (!bucket || bucket.userId !== userId) {
        throw new ConvexError("Please select a valid bucket");
      }

      const category = await ctx.db.get(item.categoryId);
      if (!category || category.userId !== userId) {
        throw new ConvexError("Please select a valid category");
      }
    }

    const oldItems = await ctx.db
      .query("expenses")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.id))
      .collect();

    const oldTotal = oldItems.reduce((sum, item) => sum + item.value, 0);

    if (existing.walletId !== args.walletId) {
      const oldWallet = await ctx.db.get(existing.walletId);
      if (oldWallet) {
        await ctx.db.patch(existing.walletId, {
          balance: oldWallet.balance + oldTotal,
        });
      }
    } else {
      await ctx.db.patch(args.walletId, {
        balance: wallet.balance + oldTotal,
      });
    }

    for (const item of oldItems) {
      const bucket = await ctx.db.get(item.bucketId);
      if (bucket) {
        await ctx.db.patch(item.bucketId, {
          balance: bucket.balance + item.value,
        });
      }
    }

    for (const item of oldItems) {
      await ctx.db.delete(item._id);
    }

    const description = args.description?.trim();
    if (description && description.length > 255)
      throw new ConvexError("Description must be 255 characters or less");

    await ctx.db.patch(args.id, {
      walletId: args.walletId,
      date: args.date,
      source,
      description: description || undefined,
    });

    const newTotal = args.items.reduce((sum, item) => sum + item.value, 0);

    for (const item of args.items) {
      await ctx.db.insert("expenses", {
        userId,
        walletId: args.walletId,
        bucketId: item.bucketId,
        categoryId: item.categoryId,
        groupId: args.id,
        title: item.title.trim(),
        description: item.description?.trim() || "",
        value: item.value,
        source,
        date: args.date,
      });

      const bucket = await ctx.db.get(item.bucketId);
      if (bucket) {
        await ctx.db.patch(item.bucketId, {
          balance: bucket.balance - item.value,
        });
      }
    }

    if (existing.walletId !== args.walletId) {
      await ctx.db.patch(args.walletId, {
        balance: wallet.balance - newTotal,
      });
    } else {
      const currentWallet = await ctx.db.get(args.walletId);
      if (currentWallet) {
        await ctx.db.patch(args.walletId, {
          balance: currentWallet.balance - newTotal,
        });
      }
    }

    return args.id;
  },
});

export const deleteExpenseGroup = mutation({
  args: { id: v.id("expenseGroups") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const group = await ctx.db.get(args.id);
    if (!group || group.userId !== userId) {
      throw new ConvexError(`Expense group ${args.id} not found`);
    }

    const items = await ctx.db
      .query("expenses")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.id))
      .collect();

    const totalValue = items.reduce((sum, item) => sum + item.value, 0);

    const wallet = await ctx.db.get(group.walletId);
    if (wallet) {
      await ctx.db.patch(group.walletId, {
        balance: wallet.balance + totalValue,
      });
    }

    for (const item of items) {
      const bucket = await ctx.db.get(item.bucketId);
      if (bucket) {
        await ctx.db.patch(item.bucketId, {
          balance: bucket.balance + item.value,
        });
      }
      await ctx.db.delete(item._id);
    }

    await ctx.db.delete(args.id);

    return group;
  },
});
