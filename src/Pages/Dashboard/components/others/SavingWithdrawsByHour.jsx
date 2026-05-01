/* eslint-disable react/prop-types */
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartConfig = {
  deposits: { label: "Deposits", color: "hsl(var(--chart-1))" },
  withdrawals: { label: "Withdrawals", color: "hsl(var(--chart-2))" },
};

// Accepts sparklines: [{ date, deposits, withdrawals }]
export function SavingWithdrawsByHour({ sparklines = [] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ChartContainer config={chartConfig} className="p-0">
        <LineChart data={sparklines} margin={{ left: 12, right: 12 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => {
              const d = new Date(value);
              return d.toLocaleDateString("default", { month: "short", day: "numeric" });
            }}
          />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <Line
            dataKey="deposits"
            type="monotone"
            stroke={chartConfig.deposits.color}
            strokeWidth={2}
            dot={false}
          />
          <Line
            dataKey="withdrawals"
            type="monotone"
            stroke={chartConfig.withdrawals.color}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartContainer>
    </ResponsiveContainer>
  );
}
