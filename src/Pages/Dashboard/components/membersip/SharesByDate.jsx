/* eslint-disable react/prop-types */
import { Bar, BarChart, CartesianGrid, XAxis, Tooltip, ResponsiveContainer } from "recharts";

// Accepts chartData: shares_trend array from backend (may be empty)
export function SharesByDate({ chartData = [] }) {
  const valid = Array.isArray(chartData) && chartData.length > 0 ? chartData : [];

  if (valid.length === 0) {
    return (
      <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
        No shares data available for this period.
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer>
        <BarChart data={valid} margin={{ top: 8, left: 12, right: 12 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            tick={{ fontSize: 11 }}
            tickFormatter={(value) => {
              const d = new Date(`${value}-01`);
              return d.toLocaleString("default", { month: "short" });
            }}
          />
          <Tooltip />
          <Bar dataKey="in_shares" fill="hsl(var(--chart-1))" name="In Shares" stackId="a" radius={[4, 4, 0, 0]} />
          <Bar dataKey="out_shares" fill="hsl(var(--chart-2))" name="Out Shares" stackId="a" radius={[0, 0, 4, 4]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
