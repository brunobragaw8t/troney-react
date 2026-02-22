import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";
import { DEFAULT_CATEGORIES } from "./categories";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Google],
  callbacks: {
    async afterUserCreatedOrUpdated(ctx, args) {
      if (args.existingUserId !== null) return;

      await Promise.all(
        DEFAULT_CATEGORIES.map((cat) =>
          ctx.db.insert("categories", {
            userId: args.userId,
            ...cat,
          }),
        ),
      );
    },
  },
});
