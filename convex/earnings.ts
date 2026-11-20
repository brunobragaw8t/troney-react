import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { requireAuth } from "./auth";

const earningArgs = {
  walletId: v.id("wallets"),
  title: v.string(),
  description: v.string(),
  value: v.number(),
  source: v.string(),
  date: v.string(),
};

type EarningFields = {
  walletId: Id<"wallets">;
  title: string;
  description: string;
  value: number;
  source: string;
  date: string;
};

function validateEarning(fields: EarningFields): EarningFields {
  const title = fields.title.trim();
  if (title.length < 1) throw new ConvexError("Title is required");
  if (title.length > 100)
    throw new ConvexError("Title must be 100 characters or less");

  const description = fields.description.trim();
  if (description.length > 255)
    throw new ConvexError("Description must be 255 characters or less");

  if (fields.value <= 0) throw new ConvexError("Value must be greater than 0");

  const source = fields.source.trim();
  if (source.length > 100)
    throw new ConvexError("Source must be 100 characters or less");

  return { ...fields, title, description, source };
}

async function createEarningForUser(
  ctx: MutationCtx,
  userId: Id<"users">,
  fields: EarningFields,
) {
  const earning = validateEarning(fields);

  const wallet = await ctx.db.get(earning.walletId);
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

  const earningId = await ctx.db.insert("earnings", { userId, ...earning });

  await ctx.db.patch(earning.walletId, {
    balance: wallet.balance + earning.value,
  });

  await Promise.all(
    buckets.map(async (bucket) => {
      const allocationValue = Math.round((earning.value * bucket.budget) / 100);

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
}

async function updateEarningForUser(
  ctx: MutationCtx,
  userId: Id<"users">,
  id: Id<"earnings">,
  fields: EarningFields,
) {
  const earning = validateEarning(fields);

  const existing = await ctx.db.get(id);
  if (!existing || existing.userId !== userId) {
    throw new ConvexError(`Earning ${id} not found`);
  }

  const wallet = await ctx.db.get(earning.walletId);
  if (!wallet || wallet.userId !== userId) {
    throw new ConvexError("Please select a valid wallet");
  }

  if (existing.walletId !== earning.walletId) {
    const oldWallet = await ctx.db.get(existing.walletId);
    if (oldWallet) {
      await ctx.db.patch(existing.walletId, {
        balance: oldWallet.balance - existing.value,
      });
    }
    await ctx.db.patch(earning.walletId, {
      balance: wallet.balance + earning.value,
    });
  } else {
    const diff = earning.value - existing.value;
    await ctx.db.patch(earning.walletId, {
      balance: wallet.balance + diff,
    });
  }

  const allocations = await ctx.db
    .query("earningAllocations")
    .withIndex("by_earningId", (q) => q.eq("earningId", id))
    .collect();

  for (const alloc of allocations) {
    if (!alloc.bucketId) continue;
    const bucket = await ctx.db.get(alloc.bucketId);
    if (bucket) {
      await ctx.db.patch(alloc.bucketId, {
        balance: bucket.balance - alloc.value,
      });
    }
  }

  await ctx.db.patch(id, earning);

  for (const alloc of allocations) {
    if (!alloc.bucketId) continue;
    const bucket = await ctx.db.get(alloc.bucketId);
    if (!bucket) continue;

    const newAllocationValue = Math.round(
      (earning.value * alloc.bucketPercentage) / 100,
    );

    await ctx.db.patch(alloc._id, { value: newAllocationValue });
    await ctx.db.patch(alloc.bucketId, {
      balance: bucket.balance + newAllocationValue,
    });
  }

  return id;
}

export const getEarnings = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (!userId)
      return { page: [], isDone: true, continueCursor: "", splitCursor: null };

    const results = await ctx.db
      .query("earnings")
      .withIndex("by_userId_date", (q) => q.eq("userId", userId))
      .order("desc")
      .paginate(args.paginationOpts);

    const page = await Promise.all(
      results.page.map(async (earning) => {
        const wallet = await ctx.db.get(earning.walletId);
        return {
          ...earning,
          walletName: wallet?.name ?? "No wallet",
        };
      }),
    );

    return { ...results, page };
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

export const getEarningsInternal = internalQuery({
  args: {
    userId: v.id("users"),
    dateFrom: v.optional(v.string()),
    dateToExclusive: v.optional(v.string()),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const earnings = await ctx.db
      .query("earnings")
      .withIndex("by_userId_date", (q) => {
        const owner = q.eq("userId", args.userId);
        const from = args.dateFrom ? owner.gte("date", args.dateFrom) : owner;

        return args.dateToExclusive
          ? from.lt("date", args.dateToExclusive)
          : from;
      })
      .order("desc")
      .take(args.limit);

    return Promise.all(
      earnings.map(async (earning) => {
        const [wallet, allocations] = await Promise.all([
          ctx.db.get(earning.walletId),
          ctx.db
            .query("earningAllocations")
            .withIndex("by_earningId", (q) => q.eq("earningId", earning._id))
            .collect(),
        ]);

        const buckets = await Promise.all(
          allocations.map(async (allocation) => {
            if (!allocation.bucketId) return null;
            const bucket = await ctx.db.get(allocation.bucketId);
            if (!bucket) return null;

            return {
              bucket: bucket.name,
              bucketPercentage: allocation.bucketPercentage,
              value: allocation.value,
            };
          }),
        );

        return {
          ...earning,
          walletName: wallet?.name ?? "No wallet",
          allocations: buckets.flatMap((bucket) => (bucket ? [bucket] : [])),
        };
      }),
    );
  },
});

export const getEarningInternal = internalQuery({
  args: { userId: v.id("users"), id: v.id("earnings") },
  handler: async (ctx, args) => {
    const earning = await ctx.db.get(args.id);

    if (!earning || earning.userId !== args.userId) return null;

    return earning;
  },
});

export const createEarning = mutation({
  args: earningArgs,
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    return createEarningForUser(ctx, userId, args);
  },
});

export const createEarningInternal = internalMutation({
  args: { userId: v.id("users"), ...earningArgs },
  handler: async (ctx, args) => {
    const { userId, ...earning } = args;

    return createEarningForUser(ctx, userId, earning);
  },
});

export const updateEarning = mutation({
  args: { id: v.id("earnings"), ...earningArgs },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const { id, ...fields } = args;

    return updateEarningForUser(ctx, userId, id, fields);
  },
});

export const updateEarningInternal = internalMutation({
  args: { userId: v.id("users"), id: v.id("earnings"), ...earningArgs },
  handler: async (ctx, args) => {
    const { userId, id, ...fields } = args;

    return updateEarningForUser(ctx, userId, id, fields);
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
