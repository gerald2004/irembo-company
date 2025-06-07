/* eslint-disable react/prop-types */
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";

export function SmsByDate({ chartData = [] }) {
  // Define gradient colors and configurations
  const chartConfig = {
    count: {
      label: "SMS Count",
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    <div className="sms-by-date-chart px-4 w-full h-full">
      <ChartContainer
        config={chartConfig}
        className="aspect-auto h-[300px] w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            {/* Gradient for the line */}
            <defs>
              <linearGradient id="smsCountGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="hsl(var(--chart-1))"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="hsl(var(--chart-1))"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />

            <XAxis
              dataKey="month"
              tickFormatter={(value) => {
                if (!value) return "";
                const [year, month] = value.split("-");
                return `${month}/${year}`;
              }}
              tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }}
              tickMargin={5}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />

            <YAxis
              tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }}
              tickMargin={5}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickFormatter={(value) => value.toLocaleString()}
            />

            <Tooltip
              content={({ payload, label }) => {
                if (!payload || !payload.length) return null;
                const [year, month] = label.split("-");
                return (
                  <ChartTooltipContent
                    labelFormatter={() => `${month}/${year}`}
                    valueFormatter={(value) => value.toLocaleString()}
                    indicator="dot"
                  />
                );
              }}
            />

            <Line
              type="monotone"
              dataKey="count"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              dot={{ r: 4, fill: "hsl(var(--chart-1))" }}
              activeDot={{ r: 6 }}
              name="SMS Count"
            />

            <Legend
              content={() => (
                <div className="text-sm text-muted-foreground">SMS Count</div>
              )}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
