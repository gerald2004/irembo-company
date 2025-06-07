/* eslint-disable react/prop-types */
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

// Define chart configuration
const chartConfig = {
  deposits: {
    label: "Deposits",
    color: "hsl(var(--chart-1))",
  },
  withdraws: {
    label: "Withdraws",
    color: "hsl(var(--chart-2))",
  },
};

export function SavingWithdrawsByHour({ withdraws, deposits }) {
  // Prepare data for the chart
  function groupByHour(transactions) {
    return transactions.reduce((acc, transaction) => {
      // Extract the hour from the timestamp
      const hour = new Date(transaction.timestamp).getHours();

      // Initialize the hour entry if it doesn't exist
      if (!acc[hour]) {
        acc[hour] = { hour, withdraws: 0, deposits: 0 };
      }

      // Sum up the amounts for each hour
      if (transaction.type === "withdraw") {
        acc[hour].withdraws += transaction.amount;
      } else if (transaction.type === "deposit") {
        acc[hour].deposits += transaction.amount;
      }

      return acc;
    }, {});
  }

  // Convert the grouped data to an array sorted by hour
  function prepareChartData(deposits, withdraws) {
    const allTransactions = [
      ...deposits.map((dep) => ({ ...dep, type: "deposit" })),
      ...withdraws.map((withd) => ({ ...withd, type: "withdraw" })),
    ];

    const groupedByHour = groupByHour(allTransactions);

    // Convert the object to a sorted array for charting
    return Object.values(groupedByHour).sort((a, b) => a.hour - b.hour);
  }

  const chartData = prepareChartData(deposits, withdraws);

  return (
    <ResponsiveContainer width="100%" height={350}>
      <ChartContainer config={chartConfig} className="p-0">
        <LineChart
          data={chartData}
          margin={{
            left: 12,
            right: 12,
          }}
        >
          <CartesianGrid vertical={false} />
          {/* <YAxis
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}`}
          /> */}
          <XAxis
            dataKey="hour"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => `${value}:00`} // Format as hour (e.g., "14:00")
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
            dataKey="withdraws"
            type="monotone"
            stroke={chartConfig.withdraws.color}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartContainer>
    </ResponsiveContainer>
  );
}
