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

const chartConfig = {
  income: { label: "Income", color: "hsl(var(--chart-1))" },
  expenses: { label: "Expenses", color: "hsl(var(--chart-2))" },
};

// Accepts monthlyData: [{ period|month, income, expenses, profit }]
export function IncomeExpenses({ monthlyData = [] }) {
  const [range, setRange] = useState("all");

  const filtered = range === "all"
    ? monthlyData
    : monthlyData.slice(-Number(range));

  return (
    <>
      <div className="flex items-center gap-2 border-b py-4 sm:flex-row">
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-[160px] rounded-lg sm:ml-auto" aria-label="Select range">
            <SelectValue placeholder="All months" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all" className="rounded-lg">All months</SelectItem>
            <SelectItem value="6" className="rounded-lg">Last 6 months</SelectItem>
            <SelectItem value="3" className="rounded-lg">Last 3 months</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={filtered}>
            <defs>
              <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-income)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-income)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-expenses)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-expenses)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="period"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const [year, month] = (value || "").split("-");
                return month && year ? `${month}/${year.slice(2)}` : value;
              }}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Area dataKey="income" type="natural" fill="url(#fillIncome)" stroke="var(--color-income)" stackId="a" />
            <Area dataKey="expenses" type="natural" fill="url(#fillExpenses)" stroke="var(--color-expenses)" stackId="a" />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </div>
    </>
  );
}
