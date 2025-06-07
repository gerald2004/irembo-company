/* eslint-disable react/prop-types */
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  Legend,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

// Define chart configuration for colors and labels
const chartConfig = {
  disbursed: {
    label: "Disbursed (Total)",
    color: "hsl(var(--chart-1))",
  },
  settled: {
    label: "Settled (Total)",
    color: "hsl(var(--chart-2))",
  },
};

export function LoansTrendBarChart({ loansTrendData }) {
  // Consolidate the data by month
  const consolidatedData = loansTrendData.reduce((acc, curr) => {
    const existing = acc.find((item) => item.month === curr.month);
    if (existing) {
      existing.disbursedCount += curr.disbursed.count;
      existing.disbursedTotal += curr.disbursed.total;
      existing.settledCount += curr.settled.count;
      existing.settledTotal += curr.settled.total;
    } else {
      acc.push({
        month: curr.month,
        disbursedCount: curr.disbursed.count,
        disbursedTotal: curr.disbursed.total,
        settledCount: curr.settled.count,
        settledTotal: curr.settled.total,
      });
    }
    return acc;
  }, []);

  // Format numbers with commas
  const formatMoney = (value) =>
    value ? value.toLocaleString("en-US", { style: "decimal" }) : "0";

  return (
    <ResponsiveContainer width="100%" height={350}>
      <ChartContainer config={chartConfig} className="p-0">
        <BarChart
          data={consolidatedData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => {
              const [year, month] = value.split("-");
              return `${month}/${year}`;
            }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "gray" }}
            tickMargin={5}
            axisLine={{ stroke: "lightgray" }}
            tickFormatter={(value) => value.toLocaleString()}
          />
          <ChartTooltip
            content={<ChartTooltipContent />}
            formatter={(value, name) =>
              `${formatMoney(value)} ${
                chartConfig[name]?.label ? `(${chartConfig[name].label})` : ""
              }`
            }
          />
          <Legend formatter={(value) => chartConfig[value]?.label || value} />
          <Bar
            dataKey="disbursedTotal"
            fill={chartConfig.disbursed.color}
            name="disbursed"
            barSize={60}
          />
          <Bar
            dataKey="settledTotal"
            fill={chartConfig.settled.color}
            name="settled"
            barSize={60}
          />
        </BarChart>
      </ChartContainer>
    </ResponsiveContainer>
  );
}
