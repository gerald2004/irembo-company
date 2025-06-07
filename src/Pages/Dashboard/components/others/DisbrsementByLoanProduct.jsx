/* eslint-disable react/prop-types */
import { Bar, BarChart, Legend, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";



const chartConfig = {
  totalCount: {
    label: "Total Count",
    color: "hsl(var(--chart-1))",
  },
  totalAmount: {
    label: "Total Amount",
    color: "hsl(var(--chart-2))",
  },
};

export function DisbursementByLoanProduct({ loan_products }) {
  return (
    <ChartContainer config={chartConfig}>
      <BarChart
        data={loan_products}
        layout="vertical"
      >
        <YAxis
          dataKey="loanProductTitle"
          type="category"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Legend />
        <Bar
          dataKey="totalAmount"
          fill="hsl(var(--chart-1))"
          name="Total Amount"
          radius={5}
        />
      </BarChart>
    </ChartContainer>
  );
}
