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
  wallets: defineTable({
    userId: v.id("users"),
    name: v.string(),
    balance: v.number(), // integer cents
  }).index("by_userId", ["userId"]),
  earnings: defineTable({
    userId: v.id("users"),
    walletId: v.id("wallets"),
    title: v.string(),
    description: v.string(),
    value: v.number(),
    source: v.string(),
    date: v.string(),
  })
    .index("by_userId", ["userId"])
    .index("by_walletId", ["walletId"]),
  earningAllocations: defineTable({
    earningId: v.id("earnings"),
    bucketId: v.optional(v.id("buckets")),
    value: v.number(),
    bucketPercentage: v.number(),
  }).index("by_earningId", ["earningId"]),
  movements: defineTable({
    userId: v.id("users"),
    walletIdSource: v.optional(v.id("wallets")),
    walletIdTarget: v.optional(v.id("wallets")),
    value: v.number(), // integer cents
    date: v.string(), // ISO date string YYYY-MM-DD
  }).index("by_userId", ["userId"]),
});
