import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  categories: defineTable({
    userId: v.id("users"),
    name: v.string(),
    color: v.string(),
    icon: v.optional(v.string()),
  }).index("by_userId", ["userId"]),
  buckets: defineTable({
    userId: v.id("users"),
    name: v.string(),
    budget: v.number(),
    balance: v.number(), // integer cents
  }).index("by_userId", ["userId"]),
});
