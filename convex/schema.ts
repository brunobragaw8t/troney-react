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
    balance: v.number(),
  }).index("by_userId", ["userId"]),
  wallets: defineTable({
    userId: v.id("users"),
    name: v.string(),
    balance: v.number(),
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
    .index("by_userId_date", ["userId", "date"])
    .index("by_walletId", ["walletId"]),
  earningAllocations: defineTable({
    earningId: v.id("earnings"),
    bucketId: v.optional(v.id("buckets")),
    value: v.number(),
    bucketPercentage: v.number(),
  }).index("by_earningId", ["earningId"]),
  expenses: defineTable({
    userId: v.id("users"),
    walletId: v.id("wallets"),
    bucketId: v.id("buckets"),
    categoryId: v.id("categories"),
    title: v.string(),
    description: v.string(),
    value: v.number(),
    source: v.string(),
    date: v.string(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_date", ["userId", "date"])
    .index("by_walletId", ["walletId"])
    .index("by_bucketId", ["bucketId"])
    .index("by_categoryId", ["categoryId"]),
  movements: defineTable({
    userId: v.id("users"),
    walletIdSource: v.optional(v.id("wallets")),
    walletIdTarget: v.optional(v.id("wallets")),
    value: v.number(),
    date: v.string(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_date", ["userId", "date"]),
});
