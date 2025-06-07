/* eslint-disable react/prop-types */
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function SharesByDate({ chartData }) {
  return (
    <div style={{ width: "100%", height: 350 }}>
      <ResponsiveContainer>
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            left: 12,
            right: 12,
          }}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            tickFormatter={(value) => {
              const date = new Date(value + "-01");
              return date.toLocaleString("default", { month: "short" });
            }}
            tick={{ fontSize: 11, fill: "gray" }}

          />
          <Tooltip />
          <Bar
            dataKey="inShares"
            fill="hsl(var(--chart-1, #8884d8))"
            name="In Shares"
            stackId="a"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="outShares"
            fill="hsl(var(--chart-2, #82ca9d))"
            name="Out Shares"
            stackId="a"
            radius={[0, 0, 4, 4]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
