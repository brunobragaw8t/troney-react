import { useMemo } from "react";
import {
  Bar,
  BarChart,
  LabelList,
  Rectangle,
  ResponsiveContainer,
  XAxis,
} from "recharts";
import { useBalanceVisibility } from "../../contexts/balance-visibility-context";
import { currency } from "../../lib/utils";

const TEAL = "#2dd4bf";
const RED = "#f87171";
const MUTED = "#94a3b8";

interface EarningsVsExpensesChartProps {
  earnings: number;
  expenses: number;
}

export function EarningsVsExpensesChart({
  earnings,
  expenses,
}: EarningsVsExpensesChartProps) {
  const { isHidden } = useBalanceVisibility();
  const net = earnings - expenses;

  const data = useMemo(
    () => [
      { name: "Earnings", value: earnings, fill: TEAL },
      { name: "Expenses", value: expenses, fill: RED },
      { name: "Net", value: Math.abs(net), fill: net >= 0 ? TEAL : RED },
    ],
    [earnings, expenses, net],
  );

  if (earnings === 0 && expenses === 0) {
    return (
      <p className="py-12 text-center text-sm text-secondary-4">No data yet</p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart
        data={data}
        margin={{ top: 32, right: 16, bottom: 0, left: 16 }}
      >
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fill: MUTED, fontSize: 13 }}
        />

        <Bar
          dataKey="value"
          isAnimationActive={false}
          shape={(props) => (
            <Rectangle {...props} fill={props.fill} radius={[6, 6, 0, 0]} />
          )}
        >
          <LabelList
            dataKey="value"
            position="top"
            formatter={(v) =>
              isHidden ? "€••••••" : currency(Number(v) / 100)
            }
            style={{ fill: "#e2e8f0", fontSize: 13, fontWeight: 600 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
