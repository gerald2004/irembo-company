/* eslint-disable react/prop-types */
import { useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


export function IncomeExpenses({ expenseTransactions, incomeTransactions }) {
  // Define chart configuration for labels and colors
  const chartConfig = {
    income: {
      label: "Income",
      color: "hsl(var(--chart-1))",
    },
    expense: {
      label: "Expense",
      color: "hsl(var(--chart-2))",
    },
  };

  // Helper function to group transactions by date
  const groupByDate = (transactions, type) => {
    const grouped = {};

    transactions.forEach((transaction) => {
      const { transaction_date, transaction_amount } = transaction;
      if (!grouped[transaction_date]) {
        grouped[transaction_date] = {
          date: transaction_date,
          income: 0,
          expense: 0,
        };
      }

      if (type === "income") {
        grouped[transaction_date].income += transaction_amount;
      } else {
        grouped[transaction_date].expense += transaction_amount;
      }
    });

    return grouped;
  };
  const [timeRange, setTimeRange] = useState("90d");

  // Group expense and income transactions separately
  const groupedExpenses = groupByDate(expenseTransactions, "expense");
  const groupedIncome = groupByDate(incomeTransactions, "income");

  // Merge the grouped data into a single dataset
  const combinedData = { ...groupedExpenses, ...groupedIncome };
  const mergedData = Object.values(combinedData);

  // Filter data by time range
  const filteredData = mergedData.filter((item) => {
    const date = new Date(item.date);
    const referenceDate = new Date("2024-11-08");
    let daysToSubtract = 90;
    if (timeRange === "30d") {
      daysToSubtract = 30;
    } else if (timeRange === "7d") {
      daysToSubtract = 7;
    }
    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysToSubtract);
    return date >= startDate;
  });

  return (
    <>
      <div className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="w-[160px] rounded-lg sm:ml-auto"
            aria-label="Select a value"
          >
            <SelectValue placeholder="Last 3 months" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="90d" className="rounded-lg">
              Last 3 months
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg">
              Last 30 days
            </SelectItem>
            <SelectItem value="7d" className="rounded-lg">
              Last 7 days
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-income)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-income)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillExpense" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-expense)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-expense)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="income"
              type="natural"
              fill="url(#fillIncome)"
              stroke="var(--color-income)"
              stackId="a"
            />
            <Area
              dataKey="expense"
              type="natural"
              fill="url(#fillExpense)"
              stroke="var(--color-expense)"
              stackId="a"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </div>
    </>
  );
}
