/* eslint-disable react/prop-types */
import { CartesianGrid, Bar, BarChart, XAxis, ResponsiveContainer } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartConfig = {
  deposits: { label: "Deposits", color: "hsl(var(--chart-1))" },
  withdrawals: { label: "Withdrawals", color: "hsl(var(--chart-2))" },
};

// Accepts timeSeries: [{ period, deposits, withdrawals }]
export function SavingWithdrawsMonths({ timeSeries = [] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ChartContainer config={chartConfig} className="p-0">
        <BarChart data={timeSeries} margin={{ left: 12, right: 12 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="period"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => {
              const [year, month] = value.split("-");
              return `${month}/${year.slice(2)}`;
            }}
          />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <Bar dataKey="deposits" fill={chartConfig.deposits.color} name="Deposits" barSize={40} />
          <Bar dataKey="withdrawals" fill={chartConfig.withdrawals.color} name="Withdrawals" barSize={40} />
        </BarChart>
      </ChartContainer>
    </ResponsiveContainer>
  );
}
