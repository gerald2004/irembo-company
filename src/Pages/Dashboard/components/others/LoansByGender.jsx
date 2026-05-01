/* eslint-disable react/prop-types */
import { Pie, PieChart, Cell, Legend, Tooltip } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
];

// Accepts gender_breakdown: { male: { count, amount }, female: { count, amount }, group: { count, amount } }
export function LoansByGenderPieChart({ gender_breakdown }) {
  const chartData = [
    {
      name: "Male",
      value: gender_breakdown?.male?.count || 0,
      amount: gender_breakdown?.male?.amount || 0,
    },
    {
      name: "Female",
      value: gender_breakdown?.female?.count || 0,
      amount: gender_breakdown?.female?.amount || 0,
    },
    {
      name: "Group",
      value: gender_breakdown?.group?.count || 0,
      amount: gender_breakdown?.group?.amount || 0,
    },
  ].filter((d) => d.value > 0);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Loans by Gender</CardTitle>
        <CardDescription className="text-xs">Individual and group borrowers</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center pb-4">
        <PieChart width={280} height={280}>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={({ name, value }) => `${name}: ${value}`}
            labelLine={true}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name, props) => [
              `${value} loans · ${props.payload.amount?.toLocaleString()}`,
              name,
            ]}
          />
          <Legend />
        </PieChart>
      </CardContent>
    </Card>
  );
}
