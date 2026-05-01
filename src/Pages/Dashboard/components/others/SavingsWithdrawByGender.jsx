/* eslint-disable react/prop-types */
import { Pie, PieChart, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = {
  deposits: "hsl(var(--chart-1))",
  withdrawals: "hsl(var(--chart-2))",
};

export function SavingsWithdrawByGender({ timeSeries = [] }) {
  const totals = timeSeries.reduce(
    (acc, row) => {
      acc.deposits += Number(row.deposits ?? 0);
      acc.withdrawals += Number(row.withdrawals ?? 0);
      return acc;
    },
    { deposits: 0, withdrawals: 0 }
  );

  const chartData = [
    { name: "Deposits", value: totals.deposits, fill: COLORS.deposits },
    { name: "Withdrawals", value: totals.withdrawals, fill: COLORS.withdrawals },
  ].filter((d) => d.value > 0);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
        No transaction data available.
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={100}
          >
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => v.toLocaleString()} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
