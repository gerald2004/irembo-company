/* eslint-disable react/prop-types */
import { Bar, BarChart, YAxis, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ChartContainer } from "@/components/ui/chart";

const chartConfig = {
  active_amount: { label: "Active Amount", color: "hsl(var(--chart-1))" },
};

// Accepts by_product: [{ product_name, active_amount, active_count, pending_count, settled_count }]
export function DisbursementByLoanProduct({ by_product = [] }) {
  return (
    <ChartContainer config={chartConfig} className="min-h-[260px] w-full">
      <ResponsiveContainer width="100%" height={Math.max(260, by_product.length * 52)}>
        <BarChart data={by_product} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
          <YAxis
            dataKey="product_name"
            type="category"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            width={160}
            tick={{ fontSize: 11 }}
          />
          <XAxis type="number" hide />
          <Tooltip
            formatter={(value, _name, props) => [
              `${value?.toLocaleString()} · ${props.payload.active_count} active`,
              props.payload.product_name,
            ]}
          />
          <Bar dataKey="active_amount" name="Active Amount" radius={4} maxBarSize={28}>
            {by_product.map((_, i) => (
              <Cell key={i} fill={`hsl(var(--chart-${(i % 5) + 1}))`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
