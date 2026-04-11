import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useMemo } from "react";
import {
  LuArrowUpRight,
  LuChartColumn,
  LuPackageOpen,
  LuWallet,
} from "react-icons/lu";
import { api } from "../../../convex/_generated/api";
import { EarningsVsExpensesChart } from "../../components/analytics/earnings-vs-expenses-chart";
import { Currency } from "../../components/ui/currency/currency";
import { Spinner } from "../../components/ui/spinner/spinner";
import { cn } from "../../lib/utils";

export const Route = createFileRoute("/control-panel/")({
  component: RouteComponent,
});

function RouteComponent() {
  const wallets = useQuery(api.wallets.getWallets);
  const buckets = useQuery(api.buckets.getBuckets);
  const earningsVsExpenses = useQuery(api.analytics.getEarningsVsExpenses);

  const totalBalance = useMemo(
    () => (wallets ?? []).reduce((sum, w) => sum + w.balance, 0),
    [wallets],
  );

  if (!wallets || !buckets || !earningsVsExpenses) {
    return <Spinner message="Loading your data" />;
  }

  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold text-white">Control panel</h1>
      <p className="mb-8 text-secondary-4">An overview of your life</p>

      <div className="flex flex-col gap-8">
        <div className="rounded-lg bg-gradient-to-br from-secondary-4 via-primary-1 to-primary-2 p-[1px]">
          <div className="rounded-lg bg-secondary-1/90 p-8">
            <div className="flex items-end justify-between">
              <div>
                <p className="mb-2 text-sm font-medium text-secondary-4">
                  Current worth
                </p>

                <p className="mb-1 bg-gradient-to-r from-primary-1 to-primary-2 bg-clip-text text-5xl font-bold text-transparent">
                  <Currency value={totalBalance} />
                </p>

                <div className="flex items-center gap-2 text-sm text-primary-1">
                  <LuArrowUpRight className="h-4 w-4" />

                  <span>
                    Across {wallets.length} wallet
                    {wallets.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-primary-1/30 p-4">
                <LuWallet className="h-8 w-8 text-primary-1" />
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-medium text-secondary-4">
            <LuWallet className="h-5 w-5 text-primary-1" />
            Your wallets
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {wallets.map((wallet) => {
              const percentage =
                totalBalance > 0 ? (wallet.balance / totalBalance) * 100 : 0;

              return (
                <div
                  key={wallet._id}
                  className="rounded-lg border border-secondary-3/50 bg-gradient-to-br from-secondary-2/50 to-secondary-1/50 p-6"
                >
                  <div className="mb-4 flex items-end justify-between">
                    <div>
                      <h3 className="mb-1 truncate text-lg font-semibold text-white">
                        {wallet.name}
                      </h3>

                      <p className="text-2xl font-bold text-primary-1">
                        <Currency value={wallet.balance} />
                      </p>
                    </div>

                    <p className="text-xs font-medium text-secondary-4">
                      {percentage.toFixed(1)}% of total
                    </p>
                  </div>

                  <div className="h-1.5 w-full rounded-full bg-secondary-1">
                    <div
                      className="h-1.5 rounded-full bg-primary-1"
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-medium text-secondary-4">
            <LuPackageOpen className="h-5 w-5 text-primary-1" />
            Your buckets
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {buckets.map((bucket) => (
              <div
                key={bucket._id}
                className="rounded-lg border border-secondary-3/50 bg-gradient-to-br from-secondary-2/50 to-secondary-1/50 p-6"
              >
                <div className="mb-1 flex items-center gap-2">
                  <div
                    className={cn("flex size-2 rounded-full bg-primary-1", {
                      "bg-yellow-500": bucket.balance <= 5000,
                      "bg-red-500": bucket.balance <= 0,
                    })}
                  />

                  <h3 className="truncate text-lg font-semibold text-white">
                    {bucket.name}
                  </h3>
                </div>

                <p className="text-2xl font-bold text-primary-1">
                  <Currency value={bucket.balance} />
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-medium text-secondary-4">
            <LuChartColumn className="h-5 w-5 text-primary-1" />
            Earnings vs Expenses
          </h2>

          <div className="rounded-lg border border-secondary-3/50 bg-gradient-to-br from-secondary-2/50 to-secondary-1/50 p-6">
            <EarningsVsExpensesChart
              earnings={earningsVsExpenses.earnings}
              expenses={earningsVsExpenses.expenses}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
