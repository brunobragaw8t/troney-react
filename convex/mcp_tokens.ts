import { ConvexError, v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { requireAuth } from "./auth";
const TOKEN_PREFIX = "trny_";
const TOKEN_BYTES = 16; // 32 hex characters

function generateToken() {
  const bytes = new Uint8Array(TOKEN_BYTES);
  crypto.getRandomValues(bytes);

  return (
    TOKEN_PREFIX +
    Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
  );
}

async function hashToken(token: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );

  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export const createToken = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const name = args.name.trim();
    if (name.length < 1) throw new ConvexError("Name is required");
    if (name.length > 50)
      throw new ConvexError("Name must be 50 characters or less");

    for (let attempt = 0; attempt < 5; attempt++) {
      const token = generateToken();
      const tokenHash = await hashToken(token);

      const existing = await ctx.db
        .query("mcpTokens")
        .withIndex("by_tokenHash", (q) => q.eq("tokenHash", tokenHash))
        .unique();

      if (existing) continue;

      const id = await ctx.db.insert("mcpTokens", {
        userId,
        tokenHash,
        name,
        createdAt: Date.now(),
      });

      return { id, token };
    }

    throw new ConvexError("Could not generate a unique token, try again");
  },
});

export const getTokens = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);

    const tokens = await ctx.db
      .query("mcpTokens")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return tokens.map((token) => ({
      _id: token._id,
      createdAt: token.createdAt,
      name: token.name,
      lastUsedAt: token.lastUsedAt,
    }));
  },
});

export const deleteToken = mutation({
  args: { id: v.id("mcpTokens") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const token = await ctx.db.get(args.id);

    if (!token || token.userId !== userId) {
      throw new ConvexError(`Token ${args.id} not found`);
    }

    await ctx.db.delete(args.id);
  },
});

export const getUserIdByToken = internalQuery({
  args: { tokenHash: v.string() },
  handler: async (ctx, args) => {
    const token = await ctx.db
      .query("mcpTokens")
      .withIndex("by_tokenHash", (q) => q.eq("tokenHash", args.tokenHash))
      .unique();

    if (!token) return null;

    return { userId: token.userId, tokenId: token._id };
  },
});

export const touchLastUsed = internalMutation({
  args: { id: v.id("mcpTokens") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { lastUsedAt: Date.now() });
  },
});
