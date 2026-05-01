/* eslint-disable react/prop-types */
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartConfig = {
  disbursed_amount: { label: "Disbursed", color: "hsl(var(--chart-1))" },
  settled_amount: { label: "Settled", color: "hsl(var(--chart-2))" },
};

// Accepts monthly_trend: [{ month, disbursed_count, disbursed_amount, settled_count, settled_amount }]
export function LoansTrendBarChart({ monthly_trend = [] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ChartContainer config={chartConfig} className="p-0">
        <BarChart data={monthly_trend} margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => {
              const [year, month] = value.split("-");
              return `${month}/${year.slice(2)}`;
            }}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => v.toLocaleString()}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Legend formatter={(v) => chartConfig[v]?.label || v} />
          <Bar dataKey="disbursed_amount" fill={chartConfig.disbursed_amount.color} name="disbursed_amount" barSize={40} />
          <Bar dataKey="settled_amount" fill={chartConfig.settled_amount.color} name="settled_amount" barSize={40} />
        </BarChart>
      </ChartContainer>
    </ResponsiveContainer>
  );
}
