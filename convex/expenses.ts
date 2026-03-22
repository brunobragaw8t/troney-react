import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./auth";

export const getExpenses = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (!userId)
      return { page: [], isDone: true, continueCursor: "", splitCursor: null };

    const results = await ctx.db
      .query("expenses")
      .withIndex("by_userId_date", (q) => q.eq("userId", userId))
      .order("desc")
      .paginate(args.paginationOpts);

    const page = await Promise.all(
      results.page.map(async (expense) => {
        const [wallet, bucket, category] = await Promise.all([
          ctx.db.get(expense.walletId),
          ctx.db.get(expense.bucketId),
          ctx.db.get(expense.categoryId),
        ]);

        return {
          ...expense,
          walletName: wallet?.name ?? "No wallet",
          bucketName: bucket?.name ?? "No bucket",
          categoryName: category?.name ?? "No category",
        };
      }),
    );

    return { ...results, page };
  },
});

export const getExpense = query({
  args: { id: v.id("expenses") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const expense = await ctx.db.get(args.id);

    if (!expense || expense.userId !== userId) {
      throw new ConvexError(`Expense ${args.id} not found`);
    }

    return expense;
  },
});

export const createExpense = mutation({
  args: {
    walletId: v.id("wallets"),
    bucketId: v.id("buckets"),
    categoryId: v.id("categories"),
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

    const source = args.source.trim();
    if (source.length > 100)
      throw new ConvexError("Source must be 100 characters or less");

    const wallet = await ctx.db.get(args.walletId);
    if (!wallet || wallet.userId !== userId) {
      throw new ConvexError("Please select a valid wallet");
    }

    const bucket = await ctx.db.get(args.bucketId);
    if (!bucket || bucket.userId !== userId) {
      throw new ConvexError("Please select a valid bucket");
    }

    const category = await ctx.db.get(args.categoryId);
    if (!category || category.userId !== userId) {
      throw new ConvexError("Please select a valid category");
    }

    const expenseId = await ctx.db.insert("expenses", {
      userId,
      walletId: args.walletId,
      bucketId: args.bucketId,
      categoryId: args.categoryId,
      title,
      description,
      value: args.value,
      source,
      date: args.date,
    });

    await ctx.db.patch(args.walletId, {
      balance: wallet.balance - args.value,
    });

    await ctx.db.patch(args.bucketId, {
      balance: bucket.balance - args.value,
    });

    return expenseId;
  },
});

export const updateExpense = mutation({
  args: {
    id: v.id("expenses"),
    walletId: v.id("wallets"),
    bucketId: v.id("buckets"),
    categoryId: v.id("categories"),
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

    const source = args.source.trim();
    if (source.length > 100)
      throw new ConvexError("Source must be 100 characters or less");

    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== userId) {
      throw new ConvexError(`Expense ${args.id} not found`);
    }

    const wallet = await ctx.db.get(args.walletId);
    if (!wallet || wallet.userId !== userId) {
      throw new ConvexError("Please select a valid wallet");
    }

    const bucket = await ctx.db.get(args.bucketId);
    if (!bucket || bucket.userId !== userId) {
      throw new ConvexError("Please select a valid bucket");
    }

    const category = await ctx.db.get(args.categoryId);
    if (!category || category.userId !== userId) {
      throw new ConvexError("Please select a valid category");
    }

    const valueDiff = args.value - existing.value;

    if (existing.walletId !== args.walletId) {
      const oldWallet = await ctx.db.get(existing.walletId);
      if (oldWallet) {
        await ctx.db.patch(existing.walletId, {
          balance: oldWallet.balance + existing.value,
        });
      }
      await ctx.db.patch(args.walletId, {
        balance: wallet.balance - args.value,
      });
    } else {
      await ctx.db.patch(args.walletId, {
        balance: wallet.balance - valueDiff,
      });
    }

    if (existing.bucketId !== args.bucketId) {
      const oldBucket = await ctx.db.get(existing.bucketId);
      if (oldBucket) {
        await ctx.db.patch(existing.bucketId, {
          balance: oldBucket.balance + existing.value,
        });
      }
      await ctx.db.patch(args.bucketId, {
        balance: bucket.balance - args.value,
      });
    } else {
      await ctx.db.patch(args.bucketId, {
        balance: bucket.balance - valueDiff,
      });
    }

    await ctx.db.patch(args.id, {
      walletId: args.walletId,
      bucketId: args.bucketId,
      categoryId: args.categoryId,
      title,
      description,
      value: args.value,
      source,
      date: args.date,
    });

    return args.id;
  },
});

export const deleteExpense = mutation({
  args: { id: v.id("expenses") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const expense = await ctx.db.get(args.id);
    if (!expense || expense.userId !== userId) {
      throw new ConvexError(`Expense ${args.id} not found`);
    }

    const wallet = await ctx.db.get(expense.walletId);
    if (wallet) {
      await ctx.db.patch(expense.walletId, {
        balance: wallet.balance + expense.value,
      });
    }

    const bucket = await ctx.db.get(expense.bucketId);
    if (bucket) {
      await ctx.db.patch(expense.bucketId, {
        balance: bucket.balance + expense.value,
      });
    }

    await ctx.db.delete(args.id);

    return expense;
  },
});
