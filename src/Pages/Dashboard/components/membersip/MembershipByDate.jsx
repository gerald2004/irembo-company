/* eslint-disable react/prop-types */
import {
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  XAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

const chartConfig = {
  cumulative: { label: "Total Members", color: "hsl(var(--chart-1))" },
  new_members: { label: "New Members", color: "hsl(var(--chart-2))" },
};

// Accepts chartData: [{ month, new_members, cumulative }]
export function MembershipByDate({ chartData = [] }) {
  const valid = Array.isArray(chartData) ? chartData : [];

  return (
    <div className="px-2 w-full" style={{ height: 300 }}>
      <ChartContainer config={chartConfig} className="w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={valid} margin={{ top: 20, left: 12, right: 12 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 11 }}
              tickFormatter={(value) => {
                if (!value) return "";
                const d = new Date(`${value}-01`);
                return d.toLocaleString("default", { month: "short", year: "2-digit" });
              }}
            />
            <Tooltip
              content={({ payload, label }) => {
                if (!payload?.length) return null;
                const d = new Date(`${label}-01`);
                return (
                  <ChartTooltipContent
                    labelFormatter={() =>
                      d.toLocaleString("default", { month: "long", year: "numeric" })
                    }
                    valueFormatter={(v) => v.toLocaleString()}
                    indicator="dot"
                  />
                );
              }}
            />
            <Line
              dataKey="cumulative"
              type="monotone"
              stroke={chartConfig.cumulative.color}
              strokeWidth={2}
              dot={{ fill: chartConfig.cumulative.color, r: 4 }}
              activeDot={{ r: 6 }}
              name="Total Members"
            >
              <LabelList dataKey="cumulative" position="top" offset={12} className="fill-foreground" fontSize={11} />
            </Line>
            <Legend />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
