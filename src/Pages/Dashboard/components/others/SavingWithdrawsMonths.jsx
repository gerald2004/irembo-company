/* eslint-disable react/prop-types */
import {
  CartesianGrid,
  Bar,
  BarChart,
  XAxis,
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

export function SavingWithdrawsMonths({ withdraws, deposits }) {
  // Prepare data for the chart
  function groupByMonth(transactions) {
    return transactions?.reduce((acc, transaction) => {
      // Extract the month and year from the timestamp
      const date = new Date(transaction?.timestamp);
      const month = date?.getMonth(); // Month (0-11)
      const year = date?.getFullYear();
      const monthYear = `${year}-${month + 1}`; // Month and year string (e.g., "2023-5" for May 2023)

      // Initialize the month entry if it doesn't exist
      if (!acc[monthYear]) {
        acc[monthYear] = { monthYear, withdraws: 0, deposits: 0 };
      }

      // Sum up the amounts for each month
      if (transaction?.type === "withdraw") {
        acc[monthYear].withdraws += transaction?.amount;
      } else if (transaction.type === "deposit") {
        acc[monthYear].deposits += transaction?.amount;
      }

      return acc;
    }, {});
  }

  // Convert the grouped data to an array sorted by month
  function prepareChartData(deposits, withdraws) {
    const allTransactions = [
      ...deposits.map((dep) => ({ ...dep, type: "deposit" })),
      ...withdraws.map((withd) => ({ ...withd, type: "withdraw" })),
    ];

    const groupedByMonth = groupByMonth(allTransactions);

    // Convert the object to a sorted array for charting
    return Object.values(groupedByMonth)?.sort(
      (a, b) => new Date(a?.monthYear) - new Date(b?.monthYear)
    );
  }

  const chartData = prepareChartData(deposits, withdraws);

  return (
    <ResponsiveContainer width="100%" height={350}>
      <ChartContainer config={chartConfig} className="p-0">
        <BarChart
          data={chartData}
          margin={{
            left: 12,
            right: 12,
          }}
        >
          <CartesianGrid vertical={false} />

          <XAxis
            dataKey="monthYear"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => {
              const [year, month] = value.split("-");
              return `${month}/${year}`;
            }}
          />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <Bar
            dataKey="deposits"
            fill={chartConfig?.deposits?.color}
            name={chartConfig?.deposits?.label}
            barSize={60}
          />
          <Bar
            dataKey="withdraws"
            fill={chartConfig?.withdraws?.color}
            name={chartConfig?.withdraws?.label}
            barSize={60}
          />
        </BarChart>
      </ChartContainer>
    </ResponsiveContainer>
  );
}
