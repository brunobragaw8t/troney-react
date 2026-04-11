import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";

export const getEarningsVsExpenses = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) return { earnings: 0, expenses: 0 };

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;

    // First day of next month
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const endDate = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-01`;

    const [earnings, expenses] = await Promise.all([
      ctx.db
        .query("earnings")
        .withIndex("by_userId_date", (q) =>
          q.eq("userId", userId).gte("date", startDate).lt("date", endDate),
        )
        .collect(),
      ctx.db
        .query("expenses")
        .withIndex("by_userId_date", (q) =>
          q.eq("userId", userId).gte("date", startDate).lt("date", endDate),
        )
        .collect(),
    ]);

    const earningsSum = earnings.reduce((sum, e) => sum + e.value, 0);
    const expensesSum = expenses.reduce((sum, e) => sum + e.value, 0);

    return { earnings: earningsSum, expenses: expensesSum };
  },
});
