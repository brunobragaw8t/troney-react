import Google from "@auth/core/providers/google";
import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { DEFAULT_BUCKETS } from "./buckets";
import { DEFAULT_CATEGORIES } from "./categories";
import { DEFAULT_WALLETS } from "./wallets";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Google],
  callbacks: {
    async afterUserCreatedOrUpdated(ctx, args) {
      if (args.existingUserId !== null) return;

      await Promise.all([
        ...DEFAULT_CATEGORIES.map((cat) =>
          ctx.db.insert("categories", {
            userId: args.userId,
            ...cat,
          }),
        ),
        ...DEFAULT_BUCKETS.map((bucket) =>
          ctx.db.insert("buckets", {
            userId: args.userId,
            ...bucket,
          }),
        ),
        ...DEFAULT_WALLETS.map((wallet) =>
          ctx.db.insert("wallets", {
            userId: args.userId,
            ...wallet,
          }),
        ),
      ]);
    },
  },
});

export async function requireAuth(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);

  if (!userId) {
    throw new ConvexError("Not authenticated");
  }

  return userId;
}
