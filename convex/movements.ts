import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./auth";

export const getMovements = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) return null;

    const movements = await ctx.db
      .query("movements")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const movementsWithWallets = await Promise.all(
      movements.map(async (movement) => {
        const [sourceWallet, targetWallet] = await Promise.all([
          movement.walletIdSource ? ctx.db.get(movement.walletIdSource) : null,
          movement.walletIdTarget ? ctx.db.get(movement.walletIdTarget) : null,
        ]);
        return {
          ...movement,
          sourceWalletName: sourceWallet?.name ?? "Unknown",
          targetWalletName: targetWallet?.name ?? "Unknown",
        };
      }),
    );

    return movementsWithWallets.sort((a, b) => b.date.localeCompare(a.date));
  },
});

export const getMovement = query({
  args: { id: v.id("movements") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const movement = await ctx.db.get(args.id);

    if (!movement || movement.userId !== userId) {
      throw new ConvexError(`Movement ${args.id} not found`);
    }

    return movement;
  },
});

export const createMovement = mutation({
  args: {
    walletIdSource: v.optional(v.id("wallets")),
    walletIdTarget: v.optional(v.id("wallets")),
    value: v.number(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    if (args.value <= 0) throw new ConvexError("Value must be greater than 0");

    if (
      args.walletIdSource &&
      args.walletIdTarget &&
      args.walletIdSource === args.walletIdTarget
    ) {
      throw new ConvexError("Source and target wallets must be different");
    }

    if (args.walletIdSource) {
      const sourceWallet = await ctx.db.get(args.walletIdSource);
      if (!sourceWallet || sourceWallet.userId !== userId) {
        throw new ConvexError("Source wallet not found");
      }
      await ctx.db.patch(args.walletIdSource, {
        balance: sourceWallet.balance - args.value,
      });
    }

    if (args.walletIdTarget) {
      const targetWallet = await ctx.db.get(args.walletIdTarget);
      if (!targetWallet || targetWallet.userId !== userId) {
        throw new ConvexError("Target wallet not found");
      }
      await ctx.db.patch(args.walletIdTarget, {
        balance: targetWallet.balance + args.value,
      });
    }

    const movementId = await ctx.db.insert("movements", {
      userId,
      walletIdSource: args.walletIdSource,
      walletIdTarget: args.walletIdTarget,
      value: args.value,
      date: args.date,
    });

    return movementId;
  },
});

export const updateMovement = mutation({
  args: {
    id: v.id("movements"),
    walletIdSource: v.optional(v.id("wallets")),
    walletIdTarget: v.optional(v.id("wallets")),
    value: v.number(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    if (args.value <= 0) throw new ConvexError("Value must be greater than 0");

    if (
      args.walletIdSource &&
      args.walletIdTarget &&
      args.walletIdSource === args.walletIdTarget
    ) {
      throw new ConvexError("Source and target wallets must be different");
    }

    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== userId) {
      throw new ConvexError(`Movement ${args.id} not found`);
    }

    // Reverse old movement
    if (existing.walletIdSource) {
      const oldSource = await ctx.db.get(existing.walletIdSource);
      if (oldSource) {
        await ctx.db.patch(existing.walletIdSource, {
          balance: oldSource.balance + existing.value,
        });
      }
    }

    if (existing.walletIdTarget) {
      const oldTarget = await ctx.db.get(existing.walletIdTarget);
      if (oldTarget) {
        await ctx.db.patch(existing.walletIdTarget, {
          balance: oldTarget.balance - existing.value,
        });
      }
    }

    if (args.walletIdSource) {
      const sourceWallet = await ctx.db.get(args.walletIdSource);
      if (!sourceWallet || sourceWallet.userId !== userId) {
        throw new ConvexError("Source wallet not found");
      }
      await ctx.db.patch(args.walletIdSource, {
        balance: sourceWallet.balance - args.value,
      });
    }

    if (args.walletIdTarget) {
      const targetWallet = await ctx.db.get(args.walletIdTarget);
      if (!targetWallet || targetWallet.userId !== userId) {
        throw new ConvexError("Target wallet not found");
      }
      await ctx.db.patch(args.walletIdTarget, {
        balance: targetWallet.balance + args.value,
      });
    }

    await ctx.db.patch(args.id, {
      walletIdSource: args.walletIdSource,
      walletIdTarget: args.walletIdTarget,
      value: args.value,
      date: args.date,
    });

    return args.id;
  },
});

export const deleteMovement = mutation({
  args: { id: v.id("movements") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const movement = await ctx.db.get(args.id);
    if (!movement || movement.userId !== userId) {
      throw new ConvexError(`Movement ${args.id} not found`);
    }

    if (movement.walletIdSource) {
      const sourceWallet = await ctx.db.get(movement.walletIdSource);
      if (sourceWallet) {
        await ctx.db.patch(movement.walletIdSource, {
          balance: sourceWallet.balance + movement.value,
        });
      }
    }

    if (movement.walletIdTarget) {
      const targetWallet = await ctx.db.get(movement.walletIdTarget);
      if (targetWallet) {
        await ctx.db.patch(movement.walletIdTarget, {
          balance: targetWallet.balance - movement.value,
        });
      }
    }

    await ctx.db.delete(args.id);

    return movement;
  },
});
