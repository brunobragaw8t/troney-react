import { useMemo } from "react";
import { Pie, PieChart, ResponsiveContainer, Sector } from "recharts";
import { Currency } from "../ui/currency/currency";

export interface SpendingByCategoryEntry {
  categoryId: string;
  name: string;
  color: string;
  icon?: string | null;
  value: number;
}

interface SpendingByCategoryChartProps {
  entries: SpendingByCategoryEntry[];
}

export function SpendingByCategoryChart({
  entries,
}: SpendingByCategoryChartProps) {
  const slices = useMemo(
    () =>
      entries
        .filter((entry) => entry.value > 0)
        .sort((a, b) => b.value - a.value),
    [entries],
  );

  const total = useMemo(
    () => slices.reduce((sum, entry) => sum + entry.value, 0),
    [slices],
  );

  if (slices.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-secondary-4">No data yet</p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
      <div className="w-full sm:w-1/2">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius={0}
              outerRadius="85%"
              paddingAngle={1}
              stroke="none"
              isAnimationActive={false}
              shape={(props) => (
                <Sector {...props} fill={props.payload?.color} stroke="none" />
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="max-h-[250px] w-full flex-1 space-y-1 overflow-y-auto pr-1">
        {slices.map((entry) => (
          <li
            key={entry.categoryId}
            className="flex items-center gap-2 text-sm"
          >
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color }}
            />

            {entry.icon && (
              <span className="shrink-0" aria-hidden>
                {entry.icon}
              </span>
            )}

            <span className="truncate text-secondary-4">{entry.name}</span>

            <span className="ml-auto shrink-0 font-medium text-white">
              <Currency value={entry.value} />
            </span>

            <span className="w-9 shrink-0 text-right text-secondary-4">
              {Math.round((entry.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
