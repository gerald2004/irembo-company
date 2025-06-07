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

import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";

export function MembershipByDate({ chartData = [] }) {
  // Validate data format
  const validatedData = Array.isArray(chartData) ? chartData : [];

  const chartConfig = {
    members: {
      label: "Total Members",
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    <div className="membership-by-date-chart px-4 w-full h-full">
      <ChartContainer
        config={chartConfig}
        title="Membership Growth"
        description="Monthly membership changes"
        className="aspect-w-16 aspect-h-9 w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={validatedData}
            margin={{
              top: 20,
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                if (!value) return "";
                const date = new Date(`${value}-01`);
                return date.toLocaleString("default", { month: "short" });
              }}
              tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }}
            />
            <Tooltip
              content={({ payload, label }) => {
                if (!payload || !payload.length) return null;
                const date = new Date(`${label}-01`);
                return (
                  <ChartTooltipContent
                    labelFormatter={() =>
                      date.toLocaleString("default", {
                        month: "long",
                        year: "numeric",
                      })
                    }
                    valueFormatter={(value) => value.toLocaleString()}
                    indicator="dot"
                  />
                );
              }}
            />
            <Line
              dataKey="members"
              type="monotone"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              dot={{
                fill: "hsl(var(--chart-1))",
                r: 4,
              }}
              activeDot={{
                r: 6,
              }}
              name="Total Members"
            >
              <LabelList
                dataKey="members"
                position="top"
                offset={12}
                className="fill-foreground"
                fontSize={12}
              />
            </Line>
            <Legend
              content={() => (
                <div className="text-sm text-muted-foreground">
                  Total Members
                </div>
              )}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
